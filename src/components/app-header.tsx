import Link from "next/link";

import { auth } from "@/auth";
import { HeaderRealtimeBridge } from "@/components/realtime/header-realtime-bridge";
import { signOutToHome } from "@/lib/auth-actions";
import { countUnconfirmedIncomingOverlaps } from "@/lib/me";
import { prisma } from "@/lib/prisma";
import { isSupporterMember } from "@/lib/subscription";

function formatHeaderIncomingBadge(count: number): string {
  if (count > 9) return "9+";
  return String(count);
}

export async function AppHeader() {
  const session = await auth();
  const viewer =
    session?.user?.id == null
      ? null
      : await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { subscriptionPlanKey: true, subscriptionStatus: true },
        });
  const supporter = isSupporterMember(viewer ?? {});
  const incomingNewCount =
    session?.user?.id != null ? await countUnconfirmedIncomingOverlaps(session.user.id) : 0;

  return (
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between gap-3 px-4">
        <Link href="/" className="shrink-0 text-base font-semibold tracking-tight">
          助けっ人掲示板
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {session?.user ? (
            <>
              <Link
                href="/pricing"
                className="text-[0.75rem] font-medium text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline"
              >
                料金
              </Link>
              <span
                data-testid="header-user-name"
                className="truncate text-right text-[0.8rem] font-medium text-zinc-700"
              >
                {session.user.name}
              </span>
              {supporter ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                  サポーター
                </span>
              ) : null}
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <Link
                  href="/me"
                  data-testid="header-me-link"
                  className="text-[0.8rem] font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
                >
                  自分の流れ
                </Link>
                {incomingNewCount > 0 ? (
                  <span
                    data-testid="header-incoming-new-badge"
                    className="inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-emerald-600/12 px-1 text-[10px] font-semibold tabular-nums text-emerald-900"
                    aria-label={`新しく返ってきた重なりが ${incomingNewCount} 件`}
                  >
                    {formatHeaderIncomingBadge(incomingNewCount)}
                  </span>
                ) : null}
              </span>
              <HeaderRealtimeBridge userId={session.user.id} />
              <Link
                href="/billing"
                className="text-[0.75rem] font-medium text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline"
              >
                支払い
              </Link>
              <form action={signOutToHome}>
                <button
                  type="submit"
                  data-testid="header-sign-out"
                  className="inline-flex h-8 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 text-[0.8rem] font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  出る
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="text-[0.75rem] font-medium text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline"
              >
                料金
              </Link>
              <Link
                href="/signin"
                data-testid="header-sign-in"
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 text-[0.8rem] font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                入る
              </Link>
              <Link
                href="/signup"
                data-testid="header-sign-up"
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 px-3 text-[0.8rem] font-medium text-white transition hover:bg-emerald-700"
              >
                はじめる
              </Link>
            </>
          )}
          <Link
            href="/posts/new"
            data-testid="header-new-post"
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 px-3 text-[0.8rem] font-medium text-white transition hover:bg-zinc-700"
          >
            投稿する
          </Link>
        </div>
      </div>
    </header>
  );
}
