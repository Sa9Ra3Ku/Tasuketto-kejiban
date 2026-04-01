import type { Metadata } from "next";

import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: `利用規約 | ${siteName}`,
  description: "助けっ人掲示板の公開ベータ向けの簡易利用規約です。",
  openGraph: {
    title: `利用規約 | ${siteName}`,
    description: "助けっ人掲示板の公開ベータ向けの簡易利用規約です。",
  },
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-lg font-semibold">利用規約</h1>
      <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-700">
        <p>投稿された内容の著作権は投稿者に帰属しますが、サービス上で表示・運営に利用されます。</p>
        <p>
          攻撃、差別、嫌がらせ、違法行為の助長、なりすましなど、他者を傷つける行為は禁止します。
        </p>
        <p>
          本サービスでは、広告配信事業者による広告を表示する場合があります。広告表示や計測のため、Cookie
          等が利用されることがあります。
        </p>
        <p>
          利用状況データは、サービス改善と表示品質の維持、ならびに広告表示の運用に必要な範囲で利用します。
        </p>
        <p>
          公開ベータのため、機能や仕様は予告なく変更・停止される場合があります。必要に応じて内容は更新されます。
        </p>
      </div>
    </main>
  );
}
