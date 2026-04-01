"use client";

import { useEffect } from "react";

import { getRealtimeClient } from "@/lib/realtime-client";

type Options = {
  channelName: string;
  eventName: string;
  enabled?: boolean;
  onEvent: () => void;
};

export function useRealtimeEvent({ channelName, eventName, enabled = true, onEvent }: Options) {
  useEffect(() => {
    if (!enabled) return;

    const pusher = getRealtimeClient();
    if (!pusher) return;

    const channel = pusher.subscribe(channelName);
    channel.bind(eventName, onEvent);

    return () => {
      channel.unbind(eventName, onEvent);
    };
  }, [channelName, enabled, eventName, onEvent]);
}
