import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  createBillingPortalSessionAction,
  createSupporterCheckoutSessionAction,
} from "@/lib/billing-actions";
import { prisma } from "@/lib/prisma";
import { isSupporterMember, membershipLabel } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "会員と支払い | 助けっ人掲示板",
};

type Props = {
  searchParams?: Promise<{ checkout?: string; portal?: string }>;
};

function formatDateJP(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(date);
}

export default async function BillingPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/billing")}`);
  }

  const params = searchParams ? await searchParams : undefined;
  const checkoutSuccess = params?.checkout === "success";
  const portalUnavailable = params?.portal === "unavailable";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionPlanKey: true,
      subscriptionStatus: true,
      subscriptionCurrentPeriodEnd: true,
      stripeCustomerId: true,
    },
  });
  if (!user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/billing")}`);
  }

  const supporter = isSupporterMember(user);
  const currentPeriodEndLabel = formatDateJP(user.subscriptionCurrentPeriodEnd);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8" data-testid="billing-page">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">会員と支払い</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          いまの会員状態を確認し、支払い方法や解約は Stripe の管理画面で行えます。
        </p>
      </header>

      {checkoutSuccess ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          加入手続きが完了しました。反映まで少し時間がかかる場合があります。
        </p>
      ) : null}
      {portalUnavailable ? (
        <p className="mb-4 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
          まだ支払い情報がないため、先に加入してから管理画面へ進めます。
        </p>
      ) : null}

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">現在の状態</h2>
        <p className="mt-2 text-sm text-zinc-700" data-testid="billing-membership-label">
          {membershipLabel(user)}
        </p>
        {user.subscriptionStatus ? (
          <p className="mt-1 text-xs text-zinc-500" data-testid="billing-subscription-status">
            Stripe 状態: {user.subscriptionStatus}
          </p>
        ) : null}
        {currentPeriodEndLabel ? (
          <p className="mt-1 text-xs text-zinc-500" data-testid="billing-period-end">
            次の区切り: {currentPeriodEndLabel}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-2">
          {supporter || user.stripeCustomerId ? (
            <form action={createBillingPortalSessionAction}>
              <Button
                type="submit"
                variant="outline"
                className="w-full rounded-full"
                data-testid="billing-open-portal"
              >
                Stripe で支払いを管理する
              </Button>
            </form>
          ) : null}
          {!supporter ? (
            <form action={createSupporterCheckoutSessionAction}>
              <Button type="submit" className="w-full rounded-full" data-testid="billing-join-supporter">
                サポーター会員に加入する
              </Button>
            </form>
          ) : null}
          <Link
            href="/pricing"
            className="text-center text-xs text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
          >
            料金ページを見る
          </Link>
        </div>
      </section>
    </main>
  );
}

