import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { createSupporterCheckoutSessionAction } from "@/lib/billing-actions";
import { prisma } from "@/lib/prisma";
import { membershipLabel } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "料金 | 助けっ人掲示板",
  description: "無料のまま使える範囲と、サポーター会員で広がることを紹介します。",
};

type Props = {
  searchParams?: Promise<{ checkout?: string }>;
};

export default async function PricingPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const checkoutCanceled = params?.checkout === "cancel";
  const session = await auth();
  const viewer =
    session?.user?.id == null
      ? null
      : await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            subscriptionPlanKey: true,
            subscriptionStatus: true,
            subscriptionCurrentPeriodEnd: true,
          },
        });

  const currentMembership = viewer ? membershipLabel(viewer) : "無料";

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">料金</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          助けっ人掲示板のコア体験（読む・重ねる・手元に置く）は、これまでどおり無料で使えます。
          サポーター会員は、深く使う人向けの余白を少し広げるための仕組みです。
        </p>
      </header>

      {checkoutCanceled ? (
        <p className="mb-4 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
          加入手続きはキャンセルされました。必要なときに、またここから続けられます。
        </p>
      ) : null}

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">無料でできること</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-700">
          <li>流れを読む・投稿する・角度を重ねる</li>
          <li>手元に置いて、あとで追う</li>
          <li>/me で返ってきた重なりをまとめて見る</li>
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border bg-white p-4 shadow-sm" data-testid="pricing-supporter-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-900">サポーター会員</h2>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
            月額
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-700">
          /me の「いま返しやすい流れ」で見える件数を、無料より少し広げます。今後も、コア体験は無料のまま守ります。
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          現在の状態: <span className="font-medium text-zinc-700">{currentMembership}</span>
        </p>

        {session?.user ? (
          <form action={createSupporterCheckoutSessionAction} className="mt-4">
            <Button type="submit" className="w-full rounded-full" data-testid="pricing-join-supporter">
              サポーター会員に加入する
            </Button>
          </form>
        ) : (
          <div className="mt-4 space-y-2">
            <Link
              href={`/signin?callbackUrl=${encodeURIComponent("/pricing")}`}
              className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
              data-testid="pricing-signin-link"
            >
              入ってから加入する
            </Link>
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent("/pricing")}`}
              className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              data-testid="pricing-signup-link"
            >
              はじめての方はこちら
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

