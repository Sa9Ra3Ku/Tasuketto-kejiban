import type { Metadata } from "next";
import Link from "next/link";

import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: `広告と運営方針 | ${siteName}`,
  description: "助けっ人掲示板の広告と運営方針についてのご案内です。",
  openGraph: {
    title: `広告と運営方針 | ${siteName}`,
    description: "助けっ人掲示板の広告と運営方針についてのご案内です。",
  },
};

export default function AdsInfoPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8" data-testid="ads-info-page">
      <h1 className="text-lg font-semibold">広告と運営方針</h1>
      <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-700">
        <p>
          助けっ人掲示板は、広告とサポーター会員の仕組みを使って、流れの深堀りを続けられる場を支えていきます。
        </p>
        <p>
          広告は、読み取りや投稿の流れを邪魔しない位置に最小限で置く方針です。本文や入力の集中を壊さないことを優先します。
        </p>
        <p>
          サービスを直接支えたい方は、
          <Link href="/pricing" className="underline-offset-2 hover:underline">
            料金ページ
          </Link>
          もご覧ください。
        </p>
      </div>
    </main>
  );
}
