export const REALTIME_EVENT_DEEPDIVE_CREATED = "deepdive.created" as const;
export const REALTIME_EVENT_ME_REFRESH = "me.refresh" as const;

export function postChannelName(postId: number): string {
  return `post-${postId}`;
}

export function userChannelName(userId: string): string {
  return `user-${userId}`;
}
