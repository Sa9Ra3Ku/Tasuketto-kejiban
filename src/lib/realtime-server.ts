import "server-only";

import Pusher from "pusher";

type RealtimePayload = Record<string, unknown>;

let pusherClient: Pusher | null | undefined;

function getPusherServerClient(): Pusher | null {
  if (pusherClient !== undefined) return pusherClient;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    pusherClient = null;
    return pusherClient;
  }

  pusherClient = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherClient;
}

export async function publishRealtimeEvent(
  channel: string,
  eventName: string,
  payload: RealtimePayload,
): Promise<void> {
  const client = getPusherServerClient();
  if (!client) return;

  await client.trigger(channel, eventName, payload);
}
