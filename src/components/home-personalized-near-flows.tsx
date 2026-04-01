import { PostCard } from "@/components/post-card";
import type { PersonalizedNearFlowItem } from "@/lib/personalized-flows";
import type { SavedHandDiscoveryState } from "@/lib/saved-post-discovery";

type Props = {
  items: PersonalizedNearFlowItem[];
  handDiscoveryByPostId: Map<number, SavedHandDiscoveryState>;
};

export function HomePersonalizedNearFlows({ items, handDiscoveryByPostId }: Props) {
  const hasRows = items.length > 0;

  return (
    <section
      className="mb-4 rounded-2xl border border-violet-100/90 bg-violet-50/35 px-3 py-3 shadow-sm"
      data-testid="home-personalized-near-flows-section"
      aria-labelledby="home-personalized-near-flows-heading"
    >
      <div className="mb-2 px-1">
        <h2 id="home-personalized-near-flows-heading" className="text-sm font-semibold text-zinc-900">
          今の自分に近い流れ
        </h2>
        <p className="mt-0.5 text-xs text-zinc-600">
          /me で角度を重ねたあとでも、その続きとして外の流れへ出ていける入口です
        </p>
      </div>

      {hasRows ? (
        <ul className="space-y-3">
          {items.map(({ post, reasonLine }) => (
            <li key={post.id}>
              <p className="mb-1.5 px-1 text-xs text-violet-900/80">{reasonLine}</p>
              <PostCard
                post={post}
                href={`/posts/${post.id}`}
                handDiscovery={handDiscoveryByPostId.get(post.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="rounded-xl bg-white/60 px-2 py-3 text-sm text-zinc-600"
          data-testid="home-personalized-near-flows-empty"
        >
          <p>まだ自分に近い流れを拾えるほど、角度が重なっていません。</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
            いくつか流れを読んだり、角度を置いたりすると、ここに近い流れが見えやすくなります。
          </p>
        </div>
      )}
    </section>
  );
}
