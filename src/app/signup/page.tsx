import type { Metadata } from "next";
import Link from "next/link";

import { signUpWithCredentials } from "@/lib/auth-actions";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { siteName } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  searchParams?: Promise<{ error?: string; callbackUrl?: string }>;
};

export const metadata: Metadata = {
  title: `はじめる | ${siteName}`,
  description: "表示名・メール・パスワードを登録して、助けっ人掲示板の流れに参加できます。",
  openGraph: {
    title: `はじめる | ${siteName}`,
    description: "表示名・メール・パスワードを登録して、助けっ人掲示板の流れに参加できます。",
  },
};

export default async function SignUpPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const afterSignUpPath = safeRedirectPath(params?.callbackUrl ?? null);
  const hasEmailTaken = params?.error === "email_taken";
  const hasInvalidInput = params?.error === "invalid";
  const hasPostReturn = afterSignUpPath.startsWith("/posts/");

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">はじめる</h1>
        <p className="mt-1 text-sm text-zinc-600">
          まずは名前を置いて、気になる流れにあなたの角度を重ねてみてください。
        </p>
        {hasPostReturn ? (
          <p className="mt-2 text-xs text-zinc-500">
            はじめたあと、そのまま読んでいた流れへ戻れます。
          </p>
        ) : null}
      </div>

      {hasEmailTaken && (
        <p className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
          このメールはすでに使われています。別のメールでお試しください。
        </p>
      )}
      {hasInvalidInput && (
        <p className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
          表示名・メール・8文字以上のパスワードを入力してください。
        </p>
      )}

      <form action={signUpWithCredentials} className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
        <input type="hidden" name="callbackUrl" value={afterSignUpPath} />
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            表示名
          </label>
          <Input
            id="name"
            name="name"
            autoComplete="nickname"
            required
            placeholder="例: そら"
            data-testid="signup-name"
          />
        </div>
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
            data-testid="signup-email"
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
            autoComplete="new-password"
            minLength={8}
            required
            data-testid="signup-password"
          />
        </div>
        <Button type="submit" className="w-full rounded-full" data-testid="signup-submit">
          はじめる
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-zinc-500">
        すでに入っている方は、入るページへどうぞ。
      </p>

      <div className="mt-6 text-center">
        <Link
          href={`/signin?callbackUrl=${encodeURIComponent(afterSignUpPath)}`}
          className="text-sm text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
        >
          入る
        </Link>
      </div>
    </main>
  );
}
