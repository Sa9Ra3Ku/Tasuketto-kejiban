"use client";

import { RealtimeRouteRefresh } from "@/components/realtime/realtime-route-refresh";
import { REALTIME_EVENT_ME_REFRESH, userChannelName } from "@/lib/realtime-channels";

type Props = {
  userId: string;
  enabled?: boolean;
  testId?: string;
};

export function UserRealtimeRefresh({ userId, enabled = true, testId }: Props) {
  return (
    <RealtimeRouteRefresh
      channelName={userChannelName(userId)}
      eventName={REALTIME_EVENT_ME_REFRESH}
      enabled={enabled}
      testId={testId}
    />
  );
}
