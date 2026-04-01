import type { Metadata } from "next";
import Link from "next/link";
import { PostType } from "@prisma/client";

import { auth } from "@/auth";
import { PostCard } from "@/components/post-card";
import { InlineAdSlot } from "@/components/ads/inline-ad-slot";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HomePersonalizedNearFlows } from "@/components/home-personalized-near-flows";
import { HomeFlowSurfaces } from "@/components/home-flow-surfaces";
import { buildPostHrefWithDiscovery, normalizeDiscoveryContext } from "@/lib/discovery-context";
import { getPersonalizedNearFlows } from "@/lib/personalized-flows";
import {
  getActiveFlowPosts,
  getPopularTags,
  getPosts,
  getShallowFlowPosts,
  PostSort,
} from "@/lib/posts";
import { getSavedHandDiscoveryStateMap } from "@/lib/saved-post-discovery";
import { postTypeLabels } from "@/lib/labels";
import { siteName } from "@/lib/site";

const sortItems: Array<{ key: PostSort; label: string }> = [
  { key: "new", label: "新着順" },
  { key: "deep", label: "深堀り順" },
  { key: "hot", label: "盛り上がり順" },
];
const postTypeItems: Array<{ key: "ALL" | PostType; label: string }> = [
  { key: "ALL", label: "すべて" },
  { key: "WORRY", label: "悩み" },
  { key: "ISSUE", label: "課題" },
  { key: "DEDUCTION", label: "推理" },
  { key: "HYPOTHESIS", label: "仮説" },
  { key: "PREDICTION", label: "予想" },
];
const validPostTypes = new Set<PostType>([
  "WORRY",
  "ISSUE",
  "DEDUCTION",
  "HYPOTHESIS",
  "PREDICTION",
]);

type HomeProps = {
  searchParams: Promise<{ q?: string; postType?: string; tag?: string; sort?: string }>;
};

export const metadata: Metadata = {
  title: siteName,
  description: "モヤモヤを解決で閉じず、共感や視点を重ねて深堀りする掲示板です。",
  openGraph: {
    title: siteName,
    description: "モヤモヤを解決で閉じず、共感や視点を重ねて深堀りする掲示板です。",
  },
};

export default async function Home({ searchParams }: HomeProps) {
  const homeInlineAdSlotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_INLINE?.trim();
  const session = await auth();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const tag = params.tag?.trim() ?? "";
  const sort = (params.sort ?? "new") as PostSort;
  const validSort: PostSort = ["new", "deep", "hot"].includes(sort) ? sort : "new";
  const postType = params.postType as PostType | undefined;
  const validPostType = postType && validPostTypes.has(postType) ? postType : undefined;
  const selectedPostType = validPostType ?? "ALL";
  const discoveryContext = normalizeDiscoveryContext({
    q: q || undefined,
    postType: validPostType,
    tag: tag || undefined,
    sort: validSort,
  });
  const hasFilters = Boolean(q || validPostType || tag);
  const posts = await getPosts({ sort: validSort, q: q || undefined, postType: validPostType, tag: tag || undefined });
  const popularTags = await getPopularTags();
  const showHomeFlowSurfaces = !hasFilters;
  const userId = session?.user?.id;
  const showPersonalizedNearFlows = Boolean(userId && showHomeFlowSurfaces);
  const personalizedNearFlowItems =
    showPersonalizedNearFlows && userId ? await getPersonalizedNearFlows(userId) : [];
  const activeFlowItems = showHomeFlowSurfaces ? await getActiveFlowPosts(6) : [];
  const shallowFlowItems = showHomeFlowSurfaces
    ? await getShallowFlowPosts(
        activeFlowItems.map((item) => item.post.id),
        6,
      )
    : [];

  const discoveryHandPostIds = [
    ...posts.map((p) => p.id),
    ...activeFlowItems.map((i) => i.post.id),
    ...shallowFlowItems.map((i) => i.post.id),
    ...personalizedNearFlowItems.map((i) => i.post.id),
  ];
  const discoveryHandIdSet = new Set(discoveryHandPostIds);
  const handDiscoveryByPostId =
    userId && discoveryHandIdSet.size > 0
      ? await getSavedHandDiscoveryStateMap(userId, [...discoveryHandIdSet])
      : new Map();

  const createPageHref = (nextValues: Partial<Record<"q" | "postType" | "tag" | "sort", string | undefined>>) => {
    const search = new URLSearchParams();
    const merged = {
      q,
      sort: validSort,
      postType: validPostType,
      tag,
      ...nextValues,
    };
    if (merged.q) search.set("q", merged.q);
    if (merged.sort) search.set("sort", merged.sort);
    if (merged.postType) search.set("postType", merged.postType);
    if (merged.tag) search.set("tag", merged.tag);
    const query = search.toString();
    return query ? `/?${query}` : "/";
  };

  const stateMessages = [
    q ? `「${q}」を含む` : null,
    validPostType ? `${postTypeLabels[validPostType]}の流れ` : null,
    tag ? `タグ「${tag}」` : null,
  ].filter(Boolean);
  const stateText =
    stateMessages.length > 0
      ? `${stateMessages.join("・")}を見ています。`
      : "いま重なっている流れを広く眺めています。";

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-5">
      <section className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3">
        <h1 className="text-base font-semibold">いまのモヤモヤを、みんなで深堀りする場所</h1>
        <p className="mt-1 text-sm text-zinc-700">
          ここは答えを急ぐ場所ではなく、悩み・課題・推理・仮説・予想に別の角度を重ねる場所です。
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          はじめての方へ: <Link href="/about" className="underline-offset-2 hover:underline">助けっ人掲示板とは</Link>
          {" / "}
          <Link href="/guidelines" className="underline-offset-2 hover:underline">使い方と流れ</Link>
        </p>
      </section>

      <section className="mb-4 rounded-2xl border bg-white p-4">
        <form action="/" method="get" className="space-y-2">
          <label htmlFor="top-search" className="text-sm font-medium text-zinc-700">
            モヤモヤや角度を探す
          </label>
          <Input
            id="top-search"
            name="q"
            defaultValue={q}
            placeholder="深堀りの流れを探す"
            data-testid="home-search-input"
          />
          <input type="hidden" name="sort" value={validSort} />
          {validPostType && <input type="hidden" name="postType" value={validPostType} />}
          {tag && <input type="hidden" name="tag" value={tag} />}
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            data-testid="home-search-submit"
          >
            この条件で見る
          </button>
        </form>
      </section>

      <section className="mb-4">
        <p className="mb-2 text-xs font-medium text-zinc-500">投稿種別で流れを絞る</p>
        <div className="flex flex-wrap gap-2" data-testid="post-type-filters">
          {postTypeItems.map((item) => {
            const isActive = item.key === selectedPostType;
            const nextPostType = item.key === "ALL" ? undefined : item.key;
            return (
              <Link key={item.key} href={createPageHref({ postType: nextPostType })}>
                <Badge variant={isActive ? "default" : "secondary"} className="rounded-full px-3 py-1 text-xs">
                  {item.label}
                </Badge>
              </Link>
            );
          })}
        </div>
      </section>

      {popularTags.length > 0 && (
        <section className="mb-4">
          <p className="mb-2 text-xs font-medium text-zinc-500">タグから角度を選ぶ</p>
          <div className="flex flex-wrap gap-2" data-testid="top-tag-filters">
            {popularTags.map((tagName) => {
              const isActive = tagName === tag;
              return (
                <Link key={tagName} href={createPageHref({ tag: isActive ? undefined : tagName })}>
                  <Badge variant={isActive ? "default" : "secondary"} className="rounded-full px-3 py-1 text-xs">
                    #{tagName}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {sortItems.map((item) => (
          <Link key={item.key} href={createPageHref({ sort: item.key })}>
            <Badge
              variant={item.key === validSort ? "default" : "secondary"}
              className="rounded-full px-3 py-1 text-xs"
            >
              {item.label}
            </Badge>
          </Link>
        ))}
      </div>

      <section className="mb-4 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700" data-testid="filter-state">
        <p>{stateText}</p>
        <div className="mt-2 flex gap-3 text-xs">
          {hasFilters && (
            <Link className="text-emerald-700 underline-offset-2 hover:underline" href={createPageHref({ q: undefined, postType: undefined, tag: undefined })}>
              絞り込みを外す
            </Link>
          )}
          {(hasFilters || validSort !== "new") && (
            <Link className="text-zinc-600 underline-offset-2 hover:underline" href="/">
              全体へ戻る
            </Link>
          )}
        </div>
      </section>

      {showPersonalizedNearFlows && (
        <HomePersonalizedNearFlows items={personalizedNearFlowItems} handDiscoveryByPostId={handDiscoveryByPostId} />
      )}

      {showHomeFlowSurfaces && (
        <HomeFlowSurfaces
          activeItems={activeFlowItems}
          shallowItems={shallowFlowItems}
          handDiscoveryByPostId={handDiscoveryByPostId}
        />
      )}

      <section className="space-y-3 pb-8" data-testid="home-main-post-list">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            href={buildPostHrefWithDiscovery(post.id, discoveryContext)}
            handDiscovery={handDiscoveryByPostId.get(post.id)}
          />
        ))}
        {posts.length === 0 && (
          <div className="rounded-xl border bg-white p-4 text-sm text-zinc-600" data-testid="empty-state">
            <p>まだこの条件で重なっている流れは見つかっていません。</p>
            <p className="mt-1">角度を少しずらすと、別の流れが見つかるかもしれません。</p>
            <Link className="mt-3 inline-block text-emerald-700 underline-offset-2 hover:underline" href={createPageHref({ q: undefined, postType: undefined, tag: undefined })}>
              条件をゆるめて見直す
            </Link>
          </div>
        )}
      </section>
      <InlineAdSlot
        slot={homeInlineAdSlotId}
        className="mb-8"
        testId="home-inline-ad-slot"
      />
    </main>
  );
}
