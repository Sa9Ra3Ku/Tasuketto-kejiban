"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 text-center">
      <h1 className="text-lg font-semibold">流れの読み込みでつまずきました</h1>
      <p className="mt-2 text-sm text-zinc-600">
        少し時間をおいて、もう一度だけ読み込みを試してみてください。
      </p>
      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          もう一度試す
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          一覧へ戻る
        </Link>
      </div>
    </main>
  );
}
