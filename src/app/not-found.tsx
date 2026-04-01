import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 text-center">
      <h1 className="text-lg font-semibold">この流れは見つかりませんでした</h1>
      <p className="mt-2 text-sm text-zinc-600">
        ページが移動したか、URL が少し違うかもしれません。トップから流れを探し直してみてください。
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700"
      >
        一覧へ戻る
      </Link>
    </main>
  );
}
