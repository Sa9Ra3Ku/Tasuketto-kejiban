import type { Metadata } from "next";

import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: `プライバシー | ${siteName}`,
  description: "公開ベータ版の助けっ人掲示板における基本的な情報の取り扱いです。",
  openGraph: {
    title: `プライバシー | ${siteName}`,
    description: "公開ベータ版の助けっ人掲示板における基本的な情報の取り扱いです。",
  },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-lg font-semibold">プライバシー</h1>
      <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-700">
        <p>助けっ人掲示板では、アカウント情報（表示名、メール）と投稿・深堀り内容を保存します。</p>
        <p>サービス改善のため、利用状況に関する基本的なログを取得する場合があります。</p>
        <p>
          今後、広告配信事業者のサービスを利用する場合があります。その際、広告表示や効果測定のために Cookie
          などの識別子が利用されることがあります。
        </p>
        <p>
          取得した情報は、サービス改善、表示品質の維持、広告表示の最適化のために利用することがあります。
        </p>
        <p>
          本サービスは公開ベータ段階です。内容や運用は、品質向上のため今後変更されることがあります。
        </p>
      </div>
    </main>
  );
}
