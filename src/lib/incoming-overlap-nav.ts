/** `/me` の「自分へ返ってきた重なり」から投稿詳細へのリンク生成（取得ロジックとは分離） */

export function incomingOverlapViewHref(postId: number, deepDiveId: number): string {
  return `/posts/${postId}#deepdive-${deepDiveId}`;
}

export function incomingOverlapStackHref(postId: number, deepDiveId: number): string {
  const params = new URLSearchParams();
  params.set("composeTarget", "deepDive");
  params.set("composeParentDeepDiveId", String(deepDiveId));
  params.set("composeSource", "incoming");
  return `/posts/${postId}?${params.toString()}#deepdive-${deepDiveId}`;
}
