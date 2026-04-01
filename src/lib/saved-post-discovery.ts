import { prisma } from "@/lib/prisma";

/** discovery 面上の手元表示（新しい動きがあるときはこちらを優先） */
export type SavedHandDiscoveryState = "new_activity" | "on_hand";

/**
 * ログイン user's SavedPost を対象 postIds に限定して一括取得し、
 * lastSeenAt ?? savedAt 以降の深堀り有無で new_activity / on_hand を振り分ける。
 */
export async function getSavedHandDiscoveryStateMap(
  userId: string,
  postIds: number[],
): Promise<Map<number, SavedHandDiscoveryState>> {
  const unique = [...new Set(postIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (unique.length === 0) return new Map();

  const savedRows = await prisma.savedPost.findMany({
    where: { userId, postId: { in: unique }, post: { isHidden: false } },
    select: { postId: true, createdAt: true, lastSeenAt: true },
  });
  if (savedRows.length === 0) return new Map();

  const newActivityRows = await prisma.deepDive.findMany({
    where: {
      isHidden: false,
      OR: savedRows.map((r) => ({
        postId: r.postId,
        createdAt: { gt: r.lastSeenAt ?? r.createdAt },
      })),
    },
    select: { postId: true },
  });
  const postIdsWithNew = new Set(newActivityRows.map((d) => d.postId));

  const out = new Map<number, SavedHandDiscoveryState>();
  for (const row of savedRows) {
    out.set(
      row.postId,
      postIdsWithNew.has(row.postId) ? "new_activity" : "on_hand",
    );
  }
  return out;
}
