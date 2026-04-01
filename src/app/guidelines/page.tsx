import type { Metadata } from "next";

import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: `使い方と流れ | ${siteName}`,
  description: "助けっ人掲示板で大切にしたい使い方と、深堀りの進め方です。",
  openGraph: {
    title: `使い方と流れ | ${siteName}`,
    description: "助けっ人掲示板で大切にしたい使い方と、深堀りの進め方です。",
  },
};

export default function GuidelinesPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-lg font-semibold">使い方と流れ</h1>
      <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-700">
        <p>
          まず流れを読み、背景や感情を受け取ってから、共感・視点・仮説などの角度を重ねてください。
        </p>
        <p>
          してほしい深堀りは、相手の文脈を尊重した問いかけ、具体的な観察、決めつけない仮説です。
        </p>
        <p>
          断定、攻撃、雑な決めつけ、人格否定は避けてください。ここは説教サイトでも勝ち負けの場でもありません。
        </p>
        <p>
          意見が違っても、相手を下げるより、なぜそう見えるかを丁寧に置いていくことを大切にします。
        </p>
      </div>
    </main>
  );
}
