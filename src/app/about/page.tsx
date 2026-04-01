import type { Metadata } from "next";

import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: `助けっ人掲示板とは | ${siteName}`,
  description: "助けっ人掲示板の目的と、初めて来た方向けの短い案内です。",
  openGraph: {
    title: `助けっ人掲示板とは | ${siteName}`,
    description: "助けっ人掲示板の目的と、初めて来た方向けの短い案内です。",
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-lg font-semibold">助けっ人掲示板とは</h1>
      <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-700">
        <p>
          助けっ人掲示板は、悩みや課題、推理、仮説、予想に対して、別の角度を重ねていくための場です。
        </p>
        <p>
          ここで主役なのは「すぐ正解を出すこと」ではなく、モヤモヤの輪郭を少しずつ深く見ることです。
        </p>
        <p>
          はじめて来た方は、まず流れを読んで、気になったところに共感や視点をひとつ重ねるところから始めてみてください。
        </p>
      </div>
    </main>
  );
}
