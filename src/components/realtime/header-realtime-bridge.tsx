"use client";

import { usePathname } from "next/navigation";

import { UserRealtimeRefresh } from "@/components/realtime/user-realtime-refresh";

type Props = {
  userId: string;
};

export function HeaderRealtimeBridge({ userId }: Props) {
  const pathname = usePathname();

  return (
    <UserRealtimeRefresh
      userId={userId}
      enabled={pathname !== "/me"}
      testId="header-realtime-listener"
    />
  );
}
