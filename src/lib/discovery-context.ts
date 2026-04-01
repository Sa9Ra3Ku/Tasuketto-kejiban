import { PostType } from "@prisma/client";

import { PostSort } from "@/lib/posts";

export type DiscoveryContext = {
  q?: string;
  postType?: PostType;
  tag?: string;
  sort?: PostSort;
};

type PostDiscoverySearchParams = {
  fromQ?: string;
  fromPostType?: string;
  fromTag?: string;
  fromSort?: string;
};

const validPostTypes = new Set<PostType>([
  "WORRY",
  "ISSUE",
  "DEDUCTION",
  "HYPOTHESIS",
  "PREDICTION",
]);
const validSorts = new Set<PostSort>(["new", "deep", "hot"]);

export function normalizeDiscoveryContext(context: DiscoveryContext): DiscoveryContext {
  const q = context.q?.trim();
  const tag = context.tag?.trim();

  return {
    q: q || undefined,
    postType: context.postType && validPostTypes.has(context.postType) ? context.postType : undefined,
    tag: tag || undefined,
    sort: context.sort && validSorts.has(context.sort) ? context.sort : undefined,
  };
}

export function hasDiscoveryContext(context: DiscoveryContext): boolean {
  return Boolean(context.q || context.postType || context.tag || context.sort);
}

export function readDiscoveryContextFromPostParams(
  params: PostDiscoverySearchParams,
): DiscoveryContext {
  return normalizeDiscoveryContext({
    q: params.fromQ,
    postType: params.fromPostType as PostType | undefined,
    tag: params.fromTag,
    sort: params.fromSort as PostSort | undefined,
  });
}

export function appendDiscoveryContextToSearchParams(
  searchParams: URLSearchParams,
  context: DiscoveryContext,
): URLSearchParams {
  const normalized = normalizeDiscoveryContext(context);

  if (normalized.q) searchParams.set("fromQ", normalized.q);
  if (normalized.postType) searchParams.set("fromPostType", normalized.postType);
  if (normalized.tag) searchParams.set("fromTag", normalized.tag);
  if (normalized.sort) searchParams.set("fromSort", normalized.sort);

  return searchParams;
}

export function buildPostHrefWithDiscovery(postId: number, context: DiscoveryContext): string {
  const params = appendDiscoveryContextToSearchParams(new URLSearchParams(), context);
  const query = params.toString();
  return query ? `/posts/${postId}?${query}` : `/posts/${postId}`;
}

export function buildHomeHrefFromDiscovery(context: DiscoveryContext): string {
  const normalized = normalizeDiscoveryContext(context);
  const params = new URLSearchParams();

  if (normalized.q) params.set("q", normalized.q);
  if (normalized.postType) params.set("postType", normalized.postType);
  if (normalized.tag) params.set("tag", normalized.tag);
  if (normalized.sort) params.set("sort", normalized.sort);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}
