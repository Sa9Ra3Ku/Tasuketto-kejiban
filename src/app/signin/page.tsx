import type { Metadata } from "next";
import Link from "next/link";

import { signInWithCredentials } from "@/lib/auth-actions";
import { siteName } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeRedirectPath } from "@/lib/safe-redirect";

type Props = {
  searchParams?: Promise<{ error?: string; callbackUrl?: string }>;
};

export const metadata: Metadata = {
  title: `入る | ${siteName}`,
  description: "助けっ人掲示板に入って、自分の流れや手元の流れを続けて見られます。",
  openGraph: {
    title: `入る | ${siteName}`,
    description: "助けっ人掲示板に入って、自分の流れや手元の流れを続けて見られます。",
  },
};

export default async function SignInPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const hasError = params?.error === "credentials";
  const afterSignInPath = safeRedirectPath(params?.callbackUrl ?? null);
  const hasPostReturn = afterSignInPath.startsWith("/posts/");

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">入る</h1>
        <p className="mt-1 text-sm text-zinc-600">
          自分の名前で流れに角度を置くには、ここから入ってください。
        </p>
        {hasPostReturn ? (
          <p className="mt-2 text-xs text-zinc-500">
            入ったあと、そのまま読んでいた流れへ戻れます。
          </p>
        ) : null}
      </div>

      {hasError && (
        <p
          data-testid="signin-error"
          className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          メールかパスワードが合いませんでした。
        </p>
      )}

      <form action={signInWithCredentials} className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
        <input type="hidden" name="callbackUrl" value={afterSignInPath} />
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            メール
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            data-testid="signin-email"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            パスワード
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="signin-password"
          />
        </div>
        <Button type="submit" data-testid="signin-submit" className="w-full rounded-full">
          入る
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-zinc-500">はじめての方は、先に登録してから入れます。</p>

      <div className="mt-6 text-center">
        <div className="flex items-center justify-center gap-4">
          <Link
            href={`/signup?callbackUrl=${encodeURIComponent(afterSignInPath)}`}
            className="text-sm text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
          >
            はじめる
          </Link>
          <Link href="/" className="text-sm text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline">
            一覧へ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
