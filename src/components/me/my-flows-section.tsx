import Link from "next/link";

import { PostCard } from "@/components/post-card";
import type { PostCardModel } from "@/lib/posts";

type Props = {
  posts: PostCardModel[];
};

export function MyFlowsSection({ posts }: Props) {
  return (
    <section
      data-testid="me-my-flows-section"
      className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
      aria-labelledby="me-flows-heading"
    >
      <div className="mb-3">
        <h2 id="me-flows-heading" className="text-sm font-semibold text-zinc-900">
          自分が立てた流れ
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">自分のモヤモヤから始まった流れです。</p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-4 text-center">
          <p className="text-sm text-zinc-600">まだ自分から始まった流れはありません。</p>
          <p className="mt-2">
            <Link
              href="/posts/new"
              className="text-xs font-medium text-zinc-700 underline-offset-2 hover:underline"
            >
              新しく流れを始める
            </Link>
            <span className="mx-1.5 text-zinc-300">·</span>
            <Link href="/" className="text-xs text-zinc-600 underline-offset-2 hover:underline">
              流れを読みに行く
            </Link>
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} href={`/posts/${post.id}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
