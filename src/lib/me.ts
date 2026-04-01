import { type DeepDiveType, Prisma } from "@prisma/client";

import { excerpt } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { PostCardModel } from "@/lib/posts";

/** getIncomingDeepDiveActivity / 未確認件数と同じ条件 */
export function incomingDeepDiveActivityWhere(userId: string): Prisma.DeepDiveWhereInput {
  return {
    isHidden: false,
    post: { isHidden: false },
    userId: { not: userId },
    OR: [{ post: { authorId: userId } }, { parentDeepDive: { userId: userId } }],
  };
}

const MY_POSTS_MAX = 10;
const MY_DEEP_DIVES_MAX = 10;
const INCOMING_DEEP_DIVES_MAX = 15;
const SAVED_POSTS_MAX = 10;
const SAVED_ACTIVE_POSTS_MAX = 8;

const myPostInclude = {
  postTags: { include: { tag: true } },
  _count: { select: { deepDives: true } },
} satisfies Prisma.PostInclude;

type MyPostRow = Prisma.PostGetPayload<{ include: typeof myPostInclude }>;

function rowToPostCardModel(row: MyPostRow): PostCardModel {
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

/** ログインユーザーが立てた流れ（新しい更新順、最大10件） */
export async function getMyPosts(authorId: string, limit = MY_POSTS_MAX): Promise<PostCardModel[]> {
  const rows = await prisma.post.findMany({
    where: { authorId, isHidden: false },
    include: myPostInclude,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map(rowToPostCardModel);
}

/** ログインユーザーが手元に置いた流れ（保存日時の新しい順、最大10件） */
export async function getSavedPosts(userId: string, limit = SAVED_POSTS_MAX): Promise<PostCardModel[]> {
  const rows = await prisma.savedPost.findMany({
    where: { userId, post: { isHidden: false } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      post: {
        include: myPostInclude,
      },
    },
  });
  return rows.map((row) => rowToPostCardModel(row.post));
}

/** baseline（lastSeenAt ?? savedAt）より後に作られた deep dive のうち、最新 1 件の代表 */
export type LatestNewDeepDiveSummary = {
  id: number;
  type: DeepDiveType;
  bodyExcerpt: string;
  userName: string;
  createdAt: Date;
};

export type SavedFlowActivityItem = {
  post: PostCardModel;
  savedAt: Date;
  lastSeenAt: Date | null;
  baselineAt: Date;
  newDeepDiveCount: number;
  hasNewActivity: boolean;
  reasonLine: string;
  /** 新しい動きがあるときだけ最新 1 件（createdAt desc） */
  latestNewDeepDive: LatestNewDeepDiveSummary | null;
};

function reasonLineForSavedFlowActivity(item: SavedFlowActivityItem): string {
  if (item.newDeepDiveCount >= 2) {
    return `前回見たあとに ${item.newDeepDiveCount}件 重なっています`;
  }
  return "手元に置いてから新しい角度が増えています";
}

async function buildSavedFlowActivityItems(
  userId: string,
  limit: number,
): Promise<SavedFlowActivityItem[]> {
  const rows = await prisma.savedPost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      post: {
        include: myPostInclude,
      },
    },
  });

  return Promise.all(
    rows.map(async (row) => {
      const baselineAt = row.lastSeenAt ?? row.createdAt;
      const newDeepDiveCount = await prisma.deepDive.count({
        where: {
          postId: row.postId,
          isHidden: false,
          createdAt: { gt: baselineAt },
        },
      });
      let latestNewDeepDive: LatestNewDeepDiveSummary | null = null;
      if (newDeepDiveCount > 0) {
        const latestRow = await prisma.deepDive.findFirst({
          where: {
            postId: row.postId,
            isHidden: false,
            createdAt: { gt: baselineAt },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            body: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        });
        if (latestRow) {
          latestNewDeepDive = {
            id: latestRow.id,
            type: latestRow.type,
            bodyExcerpt: excerpt(latestRow.body, 72),
            userName: latestRow.user.name,
            createdAt: latestRow.createdAt,
          };
        }
      }
      const item: SavedFlowActivityItem = {
        post: rowToPostCardModel(row.post),
        savedAt: row.createdAt,
        lastSeenAt: row.lastSeenAt,
        baselineAt,
        newDeepDiveCount,
        hasNewActivity: newDeepDiveCount > 0,
        reasonLine: "",
        latestNewDeepDive,
      };
      item.reasonLine = reasonLineForSavedFlowActivity(item);
      return item;
    }),
  );
}

/** ログインユーザーが手元に置いた流れのうち、新しく動いたものだけ（最大8件） */
export async function getSavedFlowActivity(
  userId: string,
  limit = SAVED_ACTIVE_POSTS_MAX,
): Promise<SavedFlowActivityItem[]> {
  const items = await buildSavedFlowActivityItems(userId, SAVED_POSTS_MAX);
  return items.filter((item) => item.hasNewActivity).slice(0, limit);
}

/** 「手元に置いた流れ」一覧でも新しい動きを軽く表示できるよう付与 */
export async function getSavedPostsWithActivity(
  userId: string,
  limit = SAVED_POSTS_MAX,
): Promise<SavedFlowActivityItem[]> {
  return buildSavedFlowActivityItems(userId, limit);
}

const myDeepDiveInclude = {
  post: { select: { id: true, title: true } },
  parentDeepDive: {
    select: {
      id: true,
      type: true,
      user: { select: { name: true } },
    },
  },
} satisfies Prisma.DeepDiveInclude;

export type MyDeepDiveListItem = Prisma.DeepDiveGetPayload<{ include: typeof myDeepDiveInclude }>;

/** ログインユーザーが重ねた角度（新しい順、最大10件） */
export async function getMyDeepDives(
  userId: string,
  limit = MY_DEEP_DIVES_MAX,
): Promise<MyDeepDiveListItem[]> {
  return prisma.deepDive.findMany({
    where: { userId, isHidden: false, post: { isHidden: false } },
    include: myDeepDiveInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

const incomingActivityInclude = {
  post: { select: { id: true, title: true } },
  user: { select: { name: true } },
  parentDeepDive: { select: { id: true, userId: true } },
} satisfies Prisma.DeepDiveInclude;

export type IncomingOverlapKind = "onMyFlow" | "onMyAngle";

export type IncomingDeepDiveActivityItem = {
  id: number;
  type: DeepDiveType;
  body: string;
  createdAt: Date;
  overlappedByName: string;
  post: { id: number; title: string };
  kind: IncomingOverlapKind;
};

/**
 * 自分以外のユーザーが重ねた深堀りのうち、
 * 自分の流れ（自分が author の Post）へついたもの、または
 * 自分が置いた DeepDive を親として重ねられたもの。
 * 同一 DeepDive は1件（createdAt desc で最大15件）。
 */
export async function getIncomingOverlapsSeenAt(userId: string): Promise<Date | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { incomingOverlapsSeenAt: true },
  });
  return row?.incomingOverlapsSeenAt ?? null;
}

export type IncomingOverlapInboxMeta = {
  seenAt: Date | null;
  unconfirmedCount: number;
};

/** seenAt と未確認件数を1回の User 参照＋countで取得（/me とヘッダーで共有） */
export async function getIncomingOverlapInboxMeta(userId: string): Promise<IncomingOverlapInboxMeta> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { incomingOverlapsSeenAt: true },
  });
  const seenAt = row?.incomingOverlapsSeenAt ?? null;
  const unconfirmedCount = await prisma.deepDive.count({
    where: {
      ...incomingDeepDiveActivityWhere(userId),
      ...(seenAt ? { createdAt: { gt: seenAt } } : {}),
    },
  });
  return { seenAt, unconfirmedCount };
}

/** createdAt と incomingOverlapsSeenAt の比較。seenAt が null なら常に未確認扱い */
export function isIncomingOverlapNewSinceSeen(createdAt: Date, seenAt: Date | null): boolean {
  if (seenAt == null) return true;
  return createdAt > seenAt;
}

/**
 * 「自分へ返ってきた重なり」と同義の件数のうち、
 * incomingOverlapsSeenAt より後に作られたもの（seenAt が null ならすべて）
 */
export async function countUnconfirmedIncomingOverlaps(userId: string): Promise<number> {
  const { unconfirmedCount } = await getIncomingOverlapInboxMeta(userId);
  return unconfirmedCount;
}

export type IncomingDeepDiveActivityWithNew = IncomingDeepDiveActivityItem & { isNew: boolean };

export function attachIncomingOverlapNewness(
  items: IncomingDeepDiveActivityItem[],
  seenAt: Date | null,
): IncomingDeepDiveActivityWithNew[] {
  return items.map((item) => ({
    ...item,
    isNew: isIncomingOverlapNewSinceSeen(item.createdAt, seenAt),
  }));
}

export async function getIncomingDeepDiveActivity(
  userId: string,
  limit = INCOMING_DEEP_DIVES_MAX,
): Promise<IncomingDeepDiveActivityItem[]> {
  const rows = await prisma.deepDive.findMany({
    where: incomingDeepDiveActivityWhere(userId),
    include: incomingActivityInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => {
    const kind: IncomingOverlapKind =
      row.parentDeepDive?.userId === userId ? "onMyAngle" : "onMyFlow";
    return {
      id: row.id,
      type: row.type,
      body: row.body,
      createdAt: row.createdAt,
      overlappedByName: row.user.name,
      post: row.post,
      kind,
    };
  });
}

/** `/me` 上部「いま返しやすい流れ」用の統合リスト上限 */
export const EASY_REPLY_FLOW_WORKBENCH_MAX = 10;

export type EasyReplyFlowSource = "incomingOverlap" | "savedActivity";

export type EasyReplyFlowWorkbenchItem = {
  source: EasyReplyFlowSource;
  postId: number;
  postTitle: string;
  deepDiveId: number;
  deepDiveType: DeepDiveType;
  excerptLine: string;
  activityAt: Date;
  /** A/B で味を分ける一言（世界観側） */
  contextLine: string;
  /** 何が動いたかの短い説明 */
  detailLine: string;
};

function easyReplyContextForIncoming(kind: IncomingOverlapKind): string {
  if (kind === "onMyAngle") {
    return "自分が置いた角度に、誰かの角度が返ってきています";
  }
  return "自分の流れに、誰かの角度が返ってきています";
}

const EASY_REPLY_SAVED_CONTEXT = "手元に置いた流れで、新しい角度が増えています";

/**
 * 「自分へ返ってきた重なり」と「手元で新しく動いた流れ」を1リストに統合。
 * DB は踏まない（ページで既に取った配列を渡す）。
 *
 * 優先順位: activityAt の新しい順。同時刻付近は incoming を saved より前に並べる。
 * Dedupe: postId + deepDiveId が同一なら B を落とし A のみ（角度単位の返りを優先）。
 */
export function buildEasyReplyFlowWorkbenchItems(
  incoming: IncomingDeepDiveActivityItem[],
  savedActive: SavedFlowActivityItem[],
  limit = EASY_REPLY_FLOW_WORKBENCH_MAX,
): EasyReplyFlowWorkbenchItem[] {
  const incomingKeys = new Set(incoming.map((item) => `${item.post.id}:${item.id}`));

  const fromIncoming: EasyReplyFlowWorkbenchItem[] = incoming.map((item) => ({
    source: "incomingOverlap",
    postId: item.post.id,
    postTitle: item.post.title,
    deepDiveId: item.id,
    deepDiveType: item.type,
    excerptLine: excerpt(item.body, 72),
    activityAt: item.createdAt,
    contextLine: easyReplyContextForIncoming(item.kind),
    detailLine: `${item.overlappedByName}さんの角度が届いています`,
  }));

  const fromSaved: EasyReplyFlowWorkbenchItem[] = [];
  for (const item of savedActive) {
    const latest = item.latestNewDeepDive;
    if (!latest) continue;
    const key = `${item.post.id}:${latest.id}`;
    if (incomingKeys.has(key)) continue;
    fromSaved.push({
      source: "savedActivity",
      postId: item.post.id,
      postTitle: item.post.title,
      deepDiveId: latest.id,
      deepDiveType: latest.type,
      excerptLine: latest.bodyExcerpt,
      activityAt: latest.createdAt,
      contextLine: EASY_REPLY_SAVED_CONTEXT,
      detailLine: item.reasonLine,
    });
  }

  const merged = [...fromIncoming, ...fromSaved];
  merged.sort((a, b) => {
    const dt = b.activityAt.getTime() - a.activityAt.getTime();
    if (dt !== 0) return dt;
    if (a.source === "incomingOverlap" && b.source === "savedActivity") return -1;
    if (a.source === "savedActivity" && b.source === "incomingOverlap") return 1;
    return 0;
  });

  return merged.slice(0, limit);
}
