import { PostCard } from "@/components/post-card";
import type { HomeFlowSurfaceItem } from "@/lib/posts";
import type { SavedHandDiscoveryState } from "@/lib/saved-post-discovery";

type Props = {
  activeItems: HomeFlowSurfaceItem[];
  shallowItems: HomeFlowSurfaceItem[];
  handDiscoveryByPostId: Map<number, SavedHandDiscoveryState>;
};

export function HomeFlowSurfaces({ activeItems, shallowItems, handDiscoveryByPostId }: Props) {
  return (
    <div className="mb-4 space-y-4">
      <section
        className="rounded-2xl border border-zinc-200/80 bg-white/90 px-3 py-3 shadow-sm"
        data-testid="home-active-flows-section"
        aria-labelledby="home-active-flows-heading"
      >
        <div className="mb-2 px-1">
          <h2 id="home-active-flows-heading" className="text-sm font-semibold text-zinc-900">
            今動いている流れ
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">いま重なりが動きやすいところから入れます</p>
        </div>
        {activeItems.length === 0 ? (
          <p className="px-1 py-2 text-sm text-zinc-600">今はここで目立って動いている流れはまだ少なめです。</p>
        ) : (
          <ul className="space-y-3">
            {activeItems.map(({ post, reasonLine }) => (
              <li key={post.id}>
                <p className="mb-1.5 px-1 text-xs text-zinc-500">{reasonLine}</p>
                <PostCard
                  post={post}
                  href={`/posts/${post.id}`}
                  handDiscovery={handDiscoveryByPostId.get(post.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="rounded-2xl border border-emerald-100/90 bg-emerald-50/40 px-3 py-3"
        data-testid="home-shallow-flows-section"
        aria-labelledby="home-shallow-flows-heading"
      >
        <div className="mb-2 px-1">
          <h2 id="home-shallow-flows-heading" className="text-sm font-semibold text-zinc-900">
            まだ深堀りが少ない流れ
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600">読むだけでなく、最初の角度を置きやすい入口です</p>
        </div>
        {shallowItems.length === 0 ? (
          <p className="px-1 py-2 text-sm text-zinc-600">まだ浅い流れは今はあまり見当たりません。</p>
        ) : (
          <ul className="space-y-3">
            {shallowItems.map(({ post, reasonLine }) => (
              <li key={post.id}>
                <p className="mb-1.5 px-1 text-xs text-zinc-600">{reasonLine}</p>
                <PostCard
                  post={post}
                  href={`/posts/${post.id}`}
                  handDiscovery={handDiscoveryByPostId.get(post.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
