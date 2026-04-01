import { PostType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type PostSort = "new" | "deep" | "hot";
export type PostFilters = {
  sort: PostSort;
  q?: string;
  postType?: PostType;
  tag?: string;
};

const postBaseInclude = {
  author: true,
  postTags: { include: { tag: true } },
  deepDives: {
    include: {
      user: true,
      _count: {
        select: {
          childDeepDives: true,
        },
      },
      parentDeepDive: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  _count: { select: { deepDives: true } },
} satisfies Prisma.PostInclude;

export type PostWithRelations = Prisma.PostGetPayload<{
  include: typeof postBaseInclude;
}>;

/** 一覧・関連導線のカード表示に必要な最小フィールド */
export type PostCardModel = Pick<
  PostWithRelations,
  "id" | "title" | "body" | "type" | "updatedAt" | "isHidden" | "postTags" | "_count"
>;

const relatedPostInclude = {
  postTags: { include: { tag: true } },
  _count: { select: { deepDives: true } },
} satisfies Prisma.PostInclude;

type RelatedPostRow = Prisma.PostGetPayload<{ include: typeof relatedPostInclude }>;

export type RelatedPostScoreInput = {
  currentTagIds: Set<number>;
  currentType: PostType;
};

export type ScoredRelatedParts = {
  score: number;
  sharedTagCount: number;
  sharedTagNames: string[];
  sameType: boolean;
};

export function scoreRelatedPost(
  current: RelatedPostScoreInput,
  candidate: PostCardModel,
): ScoredRelatedParts {
  const sharedTagNames: string[] = [];
  let sharedTagCount = 0;
  for (const pt of candidate.postTags) {
    if (current.currentTagIds.has(pt.tag.id)) {
      sharedTagCount += 1;
      sharedTagNames.push(pt.tag.name);
    }
  }
  const sameType = candidate.type === current.currentType;
  const tagScore = sharedTagCount * 100;
  const typeScore = sameType ? 28 : 0;
  const deepDiveCount = candidate._count.deepDives;
  const depthScore = Math.min(deepDiveCount, 18) * 2;
  const daysSince = (Date.now() - candidate.updatedAt.getTime()) / 86_400_000;
  const recencyScore = Math.max(0, Math.min(12, 14 - daysSince));
  const score = tagScore + typeScore + depthScore + recencyScore;
  return { score, sharedTagCount, sharedTagNames, sameType };
}

function reasonLineForRelated(parts: ScoredRelatedParts): string {
  if (parts.sharedTagCount >= 2) {
    return "同じタグが重なっています";
  }
  if (parts.sharedTagCount === 1 && parts.sharedTagNames[0]) {
    return `タグ「${parts.sharedTagNames[0]}」が近い流れです`;
  }
  if (parts.sameType) {
    return "同じ種類のモヤモヤに近い流れです";
  }
  return "こちらも深堀りが続いている流れです";
}

export type RelatedFlowItem = {
  post: PostCardModel;
  reasonLine: string;
};

const RELATED_FLOWS_MAX = 6;

function rowToCardModel(row: RelatedPostRow): PostCardModel {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    updatedAt: row.updatedAt,
    isHidden: row.isHidden,
    postTags: row.postTags,
    _count: row._count,
  };
}

export async function getRelatedPosts(currentPostId: number): Promise<RelatedFlowItem[]> {
  const current = await prisma.post.findUnique({
    where: { id: currentPostId },
    select: {
      isHidden: true,
      type: true,
      postTags: { select: { tag: { select: { id: true } } } },
    },
  });

  if (!current || current.isHidden) return [];

  const currentTagIds = new Set(current.postTags.map((pt) => pt.tag.id));

  const rows = await prisma.post.findMany({
    where: { id: { not: currentPostId }, isHidden: false },
    include: relatedPostInclude,
  });

  const input: RelatedPostScoreInput = {
    currentTagIds,
    currentType: current.type,
  };

  const items = rows
    .map((row) => {
      const post = rowToCardModel(row);
      const parts = scoreRelatedPost(input, post);
      return { post, parts };
    })
    .filter(({ parts }) => parts.sharedTagCount > 0 || parts.sameType)
    .map(({ post, parts }) => ({
      post,
      reasonLine: reasonLineForRelated(parts),
      score: parts.score,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, RELATED_FLOWS_MAX)
    .map(({ post, reasonLine }) => ({ post, reasonLine }));

  return items;
}

function buildPostWhere(filters: Omit<PostFilters, "sort">): Prisma.PostWhereInput {
  const conditions: Prisma.PostWhereInput[] = [{ isHidden: false }];
  const trimmedQuery = filters.q?.trim();

  if (trimmedQuery) {
    conditions.push({
      OR: [
        { title: { contains: trimmedQuery } },
        { body: { contains: trimmedQuery } },
        {
          postTags: {
            some: {
              tag: {
                name: { contains: trimmedQuery },
              },
            },
          },
        },
      ],
    });
  }

  if (filters.postType) {
    conditions.push({ type: filters.postType });
  }

  if (filters.tag?.trim()) {
    conditions.push({
      postTags: {
        some: {
          tag: {
            name: filters.tag.trim(),
          },
        },
      },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { AND: conditions };
}

export async function getPosts(filters: PostFilters): Promise<PostWithRelations[]> {
  const { sort } = filters;
  const where = buildPostWhere(filters);

  if (sort === "new") {
    return prisma.post.findMany({
      include: postBaseInclude,
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  if (sort === "deep") {
    return prisma.post.findMany({
      include: postBaseInclude,
      where,
      orderBy: [{ deepDives: { _count: "desc" } }, { updatedAt: "desc" }],
    });
  }

  const posts = await prisma.post.findMany({
    include: postBaseInclude,
    where,
  });

  return posts.sort((a, b) => calcHotScore(b) - calcHotScore(a));
}

export async function getPopularTags(limit = 8): Promise<string[]> {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { postTags: true } } },
  });

  return tags
    .sort((a, b) => b._count.postTags - a._count.postTags || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((tag) => tag.name);
}

export async function getPostById(id: number): Promise<PostWithRelations | null> {
  return prisma.post.findUnique({
    where: { id },
    include: postBaseInclude,
  });
}

export async function isPostSavedByUser(userId: string, postId: number): Promise<boolean> {
  const saved = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId, postId } },
    select: { id: true },
  });
  return Boolean(saved);
}

export type SavedPostActivityState = {
  isSaved: boolean;
  hasNewActivity: boolean;
  newDeepDiveCount: number;
  baselineAt: Date | null;
};

export async function getSavedPostActivityState(
  userId: string,
  postId: number,
): Promise<SavedPostActivityState> {
  const saved = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId, postId } },
    select: { createdAt: true, lastSeenAt: true },
  });
  if (!saved) {
    return {
      isSaved: false,
      hasNewActivity: false,
      newDeepDiveCount: 0,
      baselineAt: null,
    };
  }

  const baselineAt = saved.lastSeenAt ?? saved.createdAt;
  const newDeepDiveCount = await prisma.deepDive.count({
    where: {
      postId,
      isHidden: false,
      createdAt: { gt: baselineAt },
    },
  });

  return {
    isSaved: true,
    hasNewActivity: newDeepDiveCount > 0,
    newDeepDiveCount,
    baselineAt,
  };
}

type DeepDiveNode = {
  id: number;
  parentDeepDiveId: number | null;
};

export function collectDeepDiveFlowIds(
  deepDives: DeepDiveNode[],
  rootDeepDiveId: number,
): Set<number> {
  const childIdsByParent = new Map<number, number[]>();
  for (const deepDive of deepDives) {
    if (!deepDive.parentDeepDiveId) continue;
    const siblings = childIdsByParent.get(deepDive.parentDeepDiveId) ?? [];
    siblings.push(deepDive.id);
    childIdsByParent.set(deepDive.parentDeepDiveId, siblings);
  }

  const visited = new Set<number>();
  const stack = [rootDeepDiveId];
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    const childIds = childIdsByParent.get(currentId) ?? [];
    for (const childId of childIds) {
      if (!visited.has(childId)) stack.push(childId);
    }
  }

  return visited;
}

export function calcHotScore(post: PostWithRelations): number {
  const countScore = post._count.deepDives * 5;
  const latestDeepDive =
    post.deepDives.length > 0 ? post.deepDives[post.deepDives.length - 1] : null;
  const latest = latestDeepDive?.createdAt ?? post.updatedAt;
  const minutes = (Date.now() - latest.getTime()) / (1000 * 60);
  const freshness = Math.max(0, 120 - minutes) / 10;
  return countScore + freshness;
}

/** ホーム「今動いている流れ」「まだ深堀りが少ない流れ」用の軽量取得 */
const homeFlowSurfaceInclude = {
  postTags: { include: { tag: true } },
  _count: { select: { deepDives: true } },
  deepDives: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { createdAt: true },
  },
} satisfies Prisma.PostInclude;

type HomeFlowSurfaceRow = Prisma.PostGetPayload<{ include: typeof homeFlowSurfaceInclude }>;

export type HomeFlowSurfaceItem = {
  post: PostCardModel;
  reasonLine: string;
};

function homeFlowRowToCardModel(row: HomeFlowSurfaceRow): PostCardModel {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    updatedAt: row.updatedAt,
    isHidden: row.isHidden,
    postTags: row.postTags,
    _count: row._count,
  };
}

function calcSurfaceActiveScore(row: HomeFlowSurfaceRow): number {
  const countScore = row._count.deepDives * 5;
  const latestDeepAt = row.deepDives[0]?.createdAt ?? null;
  const latest = latestDeepAt ?? row.updatedAt;
  const minutes = (Date.now() - latest.getTime()) / (1000 * 60);
  const freshness = Math.max(0, 120 - minutes) / 10;
  return countScore + freshness;
}

function reasonLineForActiveFlow(row: HomeFlowSurfaceRow): string {
  const n = row._count.deepDives;
  const latestDeepAt = row.deepDives[0]?.createdAt ?? null;
  if (latestDeepAt) {
    const hours = (Date.now() - latestDeepAt.getTime()) / 3_600_000;
    if (hours <= 72) {
      return "最近、重なりが動いています";
    }
  }
  if (n >= 4) {
    return "いくつも角度が重なってきている流れです";
  }
  if (n >= 2) {
    return "深堀りが続いている流れです";
  }
  return "手応えを感じ始めている流れです";
}

const SHALLOW_MAX_DEEP_DIVES = 2;
const SHALLOW_RECENT_DAYS = 60;

function isRecentEnoughForShallow(row: HomeFlowSurfaceRow): boolean {
  const ms = SHALLOW_RECENT_DAYS * 86_400_000;
  const threshold = Date.now() - ms;
  return row.createdAt.getTime() >= threshold || row.updatedAt.getTime() >= threshold;
}

function reasonLineForShallowFlow(row: HomeFlowSurfaceRow): string {
  const n = row._count.deepDives;
  if (n === 0) {
    return "最初の角度を置きやすい流れです";
  }
  if (n === 1) {
    return "まだ深堀りが1件の流れです";
  }
  return "余白があって、次の角度を足しやすい流れです";
}

/**
 * 盛り上がり順（hot）と同系のスコアで、いま動きのある流れを返す（最大6件）
 */
export async function getActiveFlowPosts(limit = 6): Promise<HomeFlowSurfaceItem[]> {
  const rows = await prisma.post.findMany({
    where: { isHidden: false },
    include: homeFlowSurfaceInclude,
  });
  const sorted = [...rows].sort((a, b) => calcSurfaceActiveScore(b) - calcSurfaceActiveScore(a));
  return sorted.slice(0, limit).map((row) => ({
    post: homeFlowRowToCardModel(row),
    reasonLine: reasonLineForActiveFlow(row),
  }));
}

/**
 * 深堀りが少なく（0〜2件）、かつ作成または更新が比較的新しい流れ（最大6件）
 */
export async function getShallowFlowPosts(excludeIds: number[], limit = 6): Promise<HomeFlowSurfaceItem[]> {
  const rows = await prisma.post.findMany({
    where:
      excludeIds.length > 0
        ? { id: { notIn: excludeIds }, isHidden: false }
        : { isHidden: false },
    include: homeFlowSurfaceInclude,
    orderBy: { updatedAt: "desc" },
  });
  const picked = rows
    .filter((row) => row._count.deepDives <= SHALLOW_MAX_DEEP_DIVES && isRecentEnoughForShallow(row))
    .slice(0, limit);
  return picked.map((row) => ({
    post: homeFlowRowToCardModel(row),
    reasonLine: reasonLineForShallowFlow(row),
  }));
}
