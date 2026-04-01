import Script from "next/script";

import { adsEnabled, adsenseClient } from "@/lib/ads";

export function AdSenseHeadScript() {
  if (!adsEnabled) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`}
      crossOrigin="anonymous"
    />
  );
}
