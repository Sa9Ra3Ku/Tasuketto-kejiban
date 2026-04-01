import Link from "next/link";
import { PostType } from "@prisma/client";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { postTypeLabels } from "@/lib/labels";

import { createPost } from "./actions";

export default async function NewPostPage() {
  const session = await auth();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold">新しい投稿</h1>
        <Link
          href="/"
          className="inline-flex h-7 items-center justify-center rounded-[10px] px-2.5 text-[0.8rem] font-medium transition hover:bg-zinc-100"
        >
          一覧へ戻る
        </Link>
      </div>

      {session?.user ? (
        <form action={createPost} className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              タイトル
            </label>
            <Input id="title" name="title" required placeholder="例: 朝活が続かない理由を整理したい" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="body" className="text-sm font-medium">
              本文
            </label>
            <Textarea
              id="body"
              name="body"
              required
              rows={6}
              placeholder="今感じているモヤモヤや、考えていることを書いてください"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="type" className="text-sm font-medium">
              投稿種別
            </label>
            <select
              id="type"
              name="type"
              defaultValue={PostType.WORRY}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              {Object.values(PostType).map((type) => (
                <option key={type} value={type}>
                  {postTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tags" className="text-sm font-medium">
              タグ
            </label>
            <Input id="tags" name="tags" placeholder="例: 仕事, 将来, 習慣" />
            <p className="text-xs text-zinc-500">カンマまたは空白区切りで最大5つまで</p>
          </div>

          <Button type="submit" className="w-full rounded-full" data-testid="new-post-submit">
            投稿する
          </Button>
        </form>
      ) : (
        <div
          data-testid="new-post-login-prompt"
          className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-6 text-center shadow-sm"
        >
          <p className="text-sm leading-6 text-zinc-700">
            自分の名前でこの流れに載せるには、入ってから投稿してください。
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href="/signin"
              data-testid="new-post-signin-link"
              className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              入る
            </Link>
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent("/posts/new")}`}
              data-testid="new-post-signup-link"
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              はじめる
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
