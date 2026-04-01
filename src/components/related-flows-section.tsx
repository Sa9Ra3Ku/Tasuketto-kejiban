import { PostCard } from "@/components/post-card";
import type { DiscoveryContext } from "@/lib/discovery-context";
import { buildPostHrefWithDiscovery } from "@/lib/discovery-context";
import type { RelatedFlowItem } from "@/lib/posts";
import type { SavedHandDiscoveryState } from "@/lib/saved-post-discovery";

type Props = {
  items: RelatedFlowItem[];
  discoveryContext: DiscoveryContext;
  handDiscoveryByPostId: Map<number, SavedHandDiscoveryState>;
  isGuestReader?: boolean;
};

export function RelatedFlowsSection({
  items,
  discoveryContext,
  handDiscoveryByPostId,
  isGuestReader = false,
}: Props) {
  return (
    <section
      data-testid="related-flows-section"
      className="mt-8 rounded-2xl border border-zinc-100 bg-zinc-50/40 px-4 py-4"
      aria-labelledby="related-flows-heading"
    >
      <h2 id="related-flows-heading" className="text-sm font-medium text-zinc-800">
        {isGuestReader ? "この流れの近くにある流れ" : "この流れの近くにある深堀り"}
      </h2>
      <p className="mt-1 text-xs leading-5 text-zinc-500">
        {isGuestReader
          ? "読み終えたら、似たモヤモヤの流れにも進んでみてください。別の角度が見つかることがあります。"
          : "似たモヤモヤや重なりやすい角度の流れです。読み終えたあと、隣の深堀りへ移っても大丈夫です。"}
      </p>

      {items.length === 0 ? (
        <p
          data-testid="related-flows-empty"
          className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-white/80 px-3 py-2.5 text-sm leading-6 text-zinc-600"
        >
          まだ近くで重なっている別の流れは見つかっていません。この流れは少し孤高かもしれません。
        </p>
      ) : (
        <ul className="mt-4 list-none space-y-4 p-0">
          {items.map(({ post, reasonLine }) => (
            <li key={post.id} data-testid={`related-flow-item-${post.id}`}>
              <p className="mb-1.5 text-xs text-zinc-500">{reasonLine}</p>
              <div data-testid={`related-flow-link-${post.id}`}>
                <PostCard
                  post={post}
                  href={buildPostHrefWithDiscovery(post.id, discoveryContext)}
                  handDiscovery={handDiscoveryByPostId.get(post.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
