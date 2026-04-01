"use client";

import { useEffect, useRef } from "react";

import { adsEnabled, adsenseClient } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  slot?: string;
  label?: string;
  className?: string;
  testId?: string;
};

export function AdSlot({
  slot,
  label = "スポンサー枠",
  className = "",
  testId = "ad-slot",
}: AdSlotProps) {
  const initializedRef = useRef(false);
  const canRequestAd = adsEnabled && adsenseClient.length > 0 && Boolean(slot);

  useEffect(() => {
    if (!canRequestAd || initializedRef.current) {
      return;
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initializedRef.current = true;
    } catch {
      // Ignore runtime ad errors to avoid breaking user reading flow.
    }
  }, [canRequestAd]);

  if (!adsEnabled) {
    return null;
  }

  return (
    <section className={`rounded-xl border border-zinc-200 bg-white px-3 py-3 ${className}`} data-testid={testId}>
      <p className="mb-2 text-[11px] text-zinc-500">{label}</p>
      {canRequestAd ? (
        <ins
          className="adsbygoogle block min-h-[90px] w-full"
          style={{ display: "block" }}
          data-ad-client={adsenseClient}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex min-h-[90px] items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
          広告はこの位置に表示されます
        </div>
      )}
    </section>
  );
}
