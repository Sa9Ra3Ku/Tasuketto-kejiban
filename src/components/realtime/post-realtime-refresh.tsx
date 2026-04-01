"use client";

import { RealtimeRouteRefresh } from "@/components/realtime/realtime-route-refresh";
import { REALTIME_EVENT_DEEPDIVE_CREATED, postChannelName } from "@/lib/realtime-channels";

type Props = {
  postId: number;
};

export function PostRealtimeRefresh({ postId }: Props) {
  return (
    <RealtimeRouteRefresh
      channelName={postChannelName(postId)}
      eventName={REALTIME_EVENT_DEEPDIVE_CREATED}
      testId="post-realtime-listener"
    />
  );
}
