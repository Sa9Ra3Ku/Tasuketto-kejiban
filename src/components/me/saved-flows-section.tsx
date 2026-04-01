import Link from "next/link";

import { PostCard } from "@/components/post-card";
import type { SavedFlowActivityItem } from "@/lib/me";

type Props = {
  posts: SavedFlowActivityItem[];
};

export function SavedFlowsSection({ posts }: Props) {
  return (
    <section
      data-testid="me-saved-flows-section"
      className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
      aria-labelledby="me-saved-flows-heading"
    >
      <div className="mb-3">
        <h2 id="me-saved-flows-heading" className="text-sm font-semibold text-zinc-900">
          手元に置いた流れ
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">また戻りたい流れを、あとで開けるように置いています。</p>
      </div>

      {posts.length === 0 ? (
        <div
          data-testid="me-saved-flows-empty"
          className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-4 text-center"
        >
          <p className="text-sm text-zinc-600">まだ手元に置いた流れはありません。</p>
          <p className="mt-1 text-xs text-zinc-500">
            気になる流れを見つけたら、ここに置いておけます。
          </p>
          <p className="mt-2">
            <Link href="/" className="text-xs text-zinc-600 underline-offset-2 hover:underline">
              流れを見に行く
            </Link>
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.post.id}>
              <PostCard post={post.post} href={`/posts/${post.post.id}`} />
              {post.hasNewActivity ? (
                <p className="mt-1 px-1 text-xs text-zinc-600">{post.reasonLine}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
