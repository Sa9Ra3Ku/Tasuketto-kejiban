"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import { useRealtimeEvent } from "@/components/realtime/use-realtime-event";

type Props = {
  channelName: string;
  eventName: string;
  enabled?: boolean;
  debounceMs?: number;
  testId?: string;
};

export function RealtimeRouteRefresh({
  channelName,
  eventName,
  enabled = true,
  debounceMs = 120,
  testId,
}: Props) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEvent = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      router.refresh();
    }, debounceMs);
  }, [debounceMs, router]);

  useRealtimeEvent({
    channelName,
    eventName,
    enabled,
    onEvent: handleEvent,
  });

  return <span data-testid={testId} className="hidden" aria-hidden="true" />;
}
