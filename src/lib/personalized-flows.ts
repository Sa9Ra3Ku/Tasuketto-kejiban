import { PostType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { PostCardModel } from "@/lib/posts";

const personalizedInclude = {
  postTags: { include: { tag: true } },
  _count: { select: { deepDives: true } },
} satisfies Prisma.PostInclude;

type PersonalizedRow = Prisma.PostGetPayload<{ include: typeof personalizedInclude }>;

export type PersonalizedNearFlowItem = {
  post: PostCardModel;
  reasonLine: string;
};

const MAX_ITEMS = 6;
const RECENT_TOUCH_LIMIT = 12;
const TAG_WEIGHT_AUTHOR = 2;
const TAG_WEIGHT_FROM_DIVE_POST = 1;
const TYPE_WEIGHT_AUTHOR = 2;
const TYPE_WEIGHT_FROM_DIVE_POST = 1;
const TYPE_SCORE_MULT = 14;
const RECENT_BONUS = 22;
const ALREADY_DIVED_PENALTY = 38;

function rowToCardModel(row: PersonalizedRow): PostCardModel {
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

type ScoreParts = {
  tagPoints: number;
  typePoints: number;
  recentPoints: number;
  topTagName: string | null;
};

function buildReasonLine(parts: ScoreParts): string {
  const { tagPoints, typePoints, recentPoints, topTagName } = parts;
  const max = Math.max(tagPoints, typePoints, recentPoints);
  if (max === tagPoints && topTagName) {
    return `タグ「${topTagName}」が、いまの自分と重なっています`;
  }
  if (max === typePoints && typePoints > 0) {
    return `自分がよく触れている種類に近い流れです`;
  }
  if (max === recentPoints && recentPoints > 0) {
    return `最近、角度を置いた流れの近くにあります`;
  }
  if (topTagName) {
    return `タグ「${topTagName}」が、いまの自分と重なっています`;
  }
  if (typePoints > 0) {
    return `自分がよく触れている種類に近い流れです`;
  }
  if (recentPoints > 0) {
    return `最近、角度を置いた流れの近くにあります`;
  }
  return `いまの自分とすこし重なる流れです`;
}

/**
 * ログインユーザー向け「自分に近い流れ」。
 * 自分が著者の投稿は除外。プロフィールは「自分の投稿にタグがある」または「深堀りを1件以上置いた」こと。
 */
export async function getPersonalizedNearFlows(userId: string): Promise<PersonalizedNearFlowItem[]> {
  const [authoredPosts, deepDiveRows, divedPostIds] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: userId, isHidden: false },
      select: {
        type: true,
        postTags: { select: { tag: { select: { id: true, name: true } } } },
      },
    }),
    prisma.deepDive.findMany({
      where: { userId, isHidden: false, post: { isHidden: false } },
      orderBy: { createdAt: "desc" },
      take: 48,
      select: {
        postId: true,
        post: {
          select: {
            type: true,
            postTags: { select: { tag: { select: { id: true, name: true } } } },
          },
        },
      },
    }),
    prisma.deepDive
      .findMany({
        where: { userId, isHidden: false, post: { isHidden: false } },
        distinct: ["postId"],
        select: { postId: true },
      })
      .then((rows) => new Set(rows.map((r) => r.postId))),
  ]);

  const hasTaggedAuthored = authoredPosts.some((p) => p.postTags.length > 0);
  const hasDeepDives = deepDiveRows.length > 0;
  if (!hasTaggedAuthored && !hasDeepDives) {
    return [];
  }

  const tagWeight = new Map<number, { weight: number; name: string }>();
  const addTag = (id: number, name: string, delta: number) => {
    const cur = tagWeight.get(id);
    if (cur) {
      tagWeight.set(id, { weight: cur.weight + delta, name: cur.name });
    } else {
      tagWeight.set(id, { weight: delta, name });
    }
  };

  for (const p of authoredPosts) {
    for (const pt of p.postTags) {
      addTag(pt.tag.id, pt.tag.name, TAG_WEIGHT_AUTHOR);
    }
  }
  const divedPostsById = new Map<number, (typeof deepDiveRows)[number]["post"]>();
  for (const row of deepDiveRows) {
    if (!divedPostsById.has(row.postId)) {
      divedPostsById.set(row.postId, row.post);
    }
  }
  for (const post of divedPostsById.values()) {
    for (const pt of post.postTags) {
      addTag(pt.tag.id, pt.tag.name, TAG_WEIGHT_FROM_DIVE_POST);
    }
  }

  const typeWeight = new Map<PostType, number>();
  const addType = (t: PostType, delta: number) => {
    typeWeight.set(t, (typeWeight.get(t) ?? 0) + delta);
  };
  for (const p of authoredPosts) {
    addType(p.type, TYPE_WEIGHT_AUTHOR);
  }
  for (const post of divedPostsById.values()) {
    addType(post.type, TYPE_WEIGHT_FROM_DIVE_POST);
  }

  const recentTouchOrder: number[] = [];
  const seenRecent = new Set<number>();
  for (const row of deepDiveRows) {
    if (seenRecent.has(row.postId)) continue;
    seenRecent.add(row.postId);
    recentTouchOrder.push(row.postId);
    if (recentTouchOrder.length >= RECENT_TOUCH_LIMIT) break;
  }
  const recentSet = new Set(recentTouchOrder);

  const rows = await prisma.post.findMany({
    where: { authorId: { not: userId }, isHidden: false },
    include: personalizedInclude,
  });

  type Scored = { post: PostCardModel; score: number; parts: ScoreParts };

  const scored: Scored[] = [];

  for (const row of rows) {
    let tagPoints = 0;
    let topTagName: string | null = null;
    let topTagContrib = 0;

    for (const pt of row.postTags) {
      const tw = tagWeight.get(pt.tag.id);
      if (!tw) continue;
      const contrib = tw.weight;
      tagPoints += contrib;
      if (contrib > topTagContrib) {
        topTagContrib = contrib;
        topTagName = pt.tag.name;
      }
    }

    const tw = typeWeight.get(row.type) ?? 0;
    const typePoints = tw * TYPE_SCORE_MULT;

    let recentPoints = 0;
    if (recentSet.has(row.id)) {
      recentPoints = RECENT_BONUS;
    }

    let score = tagPoints * 10 + typePoints + recentPoints;
    if (divedPostIds.has(row.id)) {
      score -= ALREADY_DIVED_PENALTY;
    }

    if (tagPoints <= 0 && typePoints <= 0 && recentPoints <= 0) continue;
    if (score <= 0) continue;

    scored.push({
      post: rowToCardModel(row),
      score,
      parts: { tagPoints, typePoints, recentPoints, topTagName },
    });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_ITEMS).map(({ post, parts }) => ({
    post,
    reasonLine: buildReasonLine(parts),
  }));
}
