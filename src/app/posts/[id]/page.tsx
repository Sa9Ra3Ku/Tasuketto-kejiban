import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeepDiveType } from "@prisma/client";

import { auth } from "@/auth";
import { DeepDiveBubble } from "@/components/deepdive-bubble";
import { InlineAdSlot } from "@/components/ads/inline-ad-slot";
import { PostRealtimeRefresh } from "@/components/realtime/post-realtime-refresh";
import { RelatedFlowsSection } from "@/components/related-flows-section";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  appendDiscoveryContextToSearchParams,
  buildHomeHrefFromDiscovery,
  hasDiscoveryContext,
  readDiscoveryContextFromPostParams,
} from "@/lib/discovery-context";
import { excerpt, formatDateTimeJP } from "@/lib/format";
import { deepDiveTypeLabels, postTypeLabels } from "@/lib/labels";
import {
  buildPostPathForLandingAuthReturn,
  isReturnedFromSharedLandingAuth,
} from "@/lib/landing-auth-return";
import {
  collectDeepDiveFlowIds,
  getSavedPostActivityState,
  getPostById,
  getRelatedPosts,
} from "@/lib/posts";
import { getSavedHandDiscoveryStateMap } from "@/lib/saved-post-discovery";
import { getSiteUrl, siteName } from "@/lib/site";
import { buildPostMetadataDescription, buildPostShareText } from "@/lib/post-share";

import { markSavedPostSeenAction, savePostAction, unsavePostAction } from "./actions";
import { DeepDiveForm } from "./deepdive-form";
import { PostShareActions } from "./post-share-actions";
import { ReportForm } from "./report-form";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    type?: string;
    focusFromDeepDiveId?: string;
    composeDiveType?: string;
    composeTarget?: string;
    composeParentDeepDiveId?: string;
    composeSource?: string;
    composeFromWorkbench?: string;
    workbenchSource?: string;
    workbenchFlow?: string;
    returnTo?: string;
    fromQ?: string;
    fromPostType?: string;
    fromTag?: string;
    fromSort?: string;
    fromLandingAuth?: string;
    returnedFromAuth?: string;
  }>;
};

const filterItems: Array<{ key: "ALL" | DeepDiveType; label: string }> = [
  { key: "ALL", label: "すべて" },
  { key: "EMPATHY", label: deepDiveTypeLabels.EMPATHY },
  { key: "PERSPECTIVE", label: deepDiveTypeLabels.PERSPECTIVE },
  { key: "HYPOTHESIS", label: deepDiveTypeLabels.HYPOTHESIS },
  { key: "DEDUCTION", label: deepDiveTypeLabels.DEDUCTION },
  { key: "REBUTTAL", label: deepDiveTypeLabels.REBUTTAL },
  { key: "SUMMARY", label: deepDiveTypeLabels.SUMMARY },
  { key: "EXPERIENCE", label: deepDiveTypeLabels.EXPERIENCE },
];

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(Number(id));
  if (!post) {
    return {
      title: "投稿の深堀り",
      description: "助けっ人掲示板の流れです。",
    };
  }

  const description = buildPostMetadataDescription({
    title: post.title,
    body: post.body,
    type: post.type,
    tags: post.postTags.map(({ tag }) => tag.name),
  });
  const pageTitle = post.title;
  const ogTitle = `${post.title} | ${siteName}`;
  const pageUrl = new URL(`/posts/${post.id}`, getSiteUrl()).toString();

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: ogTitle,
      description,
      url: pageUrl,
      type: "article",
    },
  };
}

export default async function PostDetailPage({ params, searchParams }: Props) {
  const postBottomAdSlotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_POST_FOOTER?.trim();
  const { id } = await params;
  const allSearchParams = await searchParams;
  const {
    type,
    focusFromDeepDiveId,
    composeDiveType,
    composeTarget,
    composeParentDeepDiveId,
    composeSource,
    composeFromWorkbench,
    workbenchSource,
    workbenchFlow,
    returnTo,
  } = allSearchParams;
  const showIncomingComposeHint = composeSource === "incoming";
  const showSavedActivityComposeHint = composeSource === "savedActivity";
  const composeSourcePreserved =
    composeSource === "savedActivity" || composeSource === "incoming" ? composeSource : null;
  const fromMeEasyReplyWorkbench =
    workbenchSource === "me" && workbenchFlow === "easyReply" && returnTo === "me";
  const isMeEasyReplyStackCompose = fromMeEasyReplyWorkbench && composeFromWorkbench === "easyReply";
  const session = await auth();
  const discoveryContext = readDiscoveryContextFromPostParams(allSearchParams);
  const backToDiscoveryHref = buildHomeHrefFromDiscovery(discoveryContext);
  const hasDiscoverySource = hasDiscoveryContext(discoveryContext);
  const selectedType = Object.values(DeepDiveType).includes(type as DeepDiveType)
    ? (type as DeepDiveType)
    : null;
  const post = await getPostById(Number(id));

  if (!post) notFound();
  const postDetailPathForLandingAuthReturn = buildPostPathForLandingAuthReturn(post.id);
  const hasReturnedFromLandingAuth = isReturnedFromSharedLandingAuth({
    fromLandingAuth: allSearchParams.fromLandingAuth,
    returnedFromAuth: allSearchParams.returnedFromAuth,
  });
  const shareUrl = new URL(`/posts/${post.id}`, getSiteUrl()).toString();
  const shareText = buildPostShareText({
    title: post.title,
    body: post.body,
    type: post.type,
    tags: post.postTags.map(({ tag }) => tag.name),
  });
  const savedActivity = session?.user?.id
    ? await getSavedPostActivityState(session.user.id, post.id)
    : null;
  const isSavedByMe = savedActivity?.isSaved ?? false;
  const saveAction = savePostAction.bind(null, post.id);
  const unsaveAction = unsavePostAction.bind(null, post.id);
  const markSeenAction = markSavedPostSeenAction.bind(null, post.id);
  const relatedFlows = await getRelatedPosts(post.id);
  const relatedHandDiscoveryByPostId =
    session?.user?.id && relatedFlows.length > 0
      ? await getSavedHandDiscoveryStateMap(
          session.user.id,
          relatedFlows.map((item) => item.post.id),
        )
      : new Map();
  const focusId = Number(focusFromDeepDiveId);
  const hasValidFocusParam = Boolean(
    focusFromDeepDiveId &&
      !Number.isNaN(focusId) &&
      focusId > 0 &&
      post.deepDives.some((deepDive) => deepDive.id === focusId),
  );
  const focusedRootDeepDive = hasValidFocusParam
    ? post.deepDives.find((deepDive) => deepDive.id === focusId) ?? null
    : null;
  const focusFlowIds = focusedRootDeepDive
    ? collectDeepDiveFlowIds(post.deepDives, focusedRootDeepDive.id)
    : null;
  const initialComposeType = Object.values(DeepDiveType).includes(
    composeDiveType as DeepDiveType,
  )
    ? (composeDiveType as DeepDiveType)
    : "";
  const selectedParentDeepDive = post.deepDives.find(
    (deepDive) => String(deepDive.id) === composeParentDeepDiveId,
  );
  const initialComposeParentDeepDiveId = selectedParentDeepDive
    ? String(selectedParentDeepDive.id)
    : "";
  const composeTargetParam =
    composeTarget === "post" || composeTarget === "focusRoot" || composeTarget === "deepDive"
      ? composeTarget
      : null;
  const initialComposeTarget =
    selectedParentDeepDive
      ? "deepDive"
      : composeTargetParam === "post"
        ? "post"
        : composeTargetParam === "focusRoot"
          ? focusedRootDeepDive
            ? "focusRoot"
            : "post"
          : focusedRootDeepDive
            ? "focusRoot"
            : "post";

  const buildPostHref = ({
    nextType = selectedType,
    nextComposeType = initialComposeType,
    nextComposeTarget,
    nextComposeParentDeepDiveId,
    keepComposeTarget = true,
    keepParentDeepDiveId = false,
    nextFocusFromDeepDiveId = focusedRootDeepDive ? String(focusedRootDeepDive.id) : null,
  }: {
    nextType?: DeepDiveType | null;
    nextComposeType?: string;
    nextComposeTarget?: "post" | "focusRoot" | "deepDive";
    nextComposeParentDeepDiveId?: number;
    keepComposeTarget?: boolean;
    keepParentDeepDiveId?: boolean;
    nextFocusFromDeepDiveId?: string | null;
  } = {}) => {
    const params = new URLSearchParams();
    if (nextType) params.set("type", nextType);
    if (nextFocusFromDeepDiveId) params.set("focusFromDeepDiveId", nextFocusFromDeepDiveId);
    if (nextComposeType) params.set("composeDiveType", nextComposeType);
    const composeTargetValue = nextComposeTarget ?? (keepComposeTarget ? initialComposeTarget : undefined);
    if (composeTargetValue === "focusRoot" && !nextFocusFromDeepDiveId) {
      params.set("composeTarget", "post");
    } else if (composeTargetValue) {
      params.set("composeTarget", composeTargetValue);
    }
    if (nextComposeParentDeepDiveId) {
      params.set("composeParentDeepDiveId", String(nextComposeParentDeepDiveId));
    } else if (keepParentDeepDiveId && initialComposeParentDeepDiveId) {
      params.set("composeParentDeepDiveId", initialComposeParentDeepDiveId);
    }
    appendDiscoveryContextToSearchParams(params, discoveryContext);
    if (composeSourcePreserved) {
      params.set("composeSource", composeSourcePreserved);
    }
    if (fromMeEasyReplyWorkbench) {
      params.set("workbenchSource", "me");
      params.set("workbenchFlow", "easyReply");
      params.set("returnTo", "me");
      if (isMeEasyReplyStackCompose) {
        params.set("composeFromWorkbench", "easyReply");
      }
    }
    if (hasReturnedFromLandingAuth) {
      params.set("fromLandingAuth", "1");
      params.set("returnedFromAuth", "sharedPost");
    }
    const query = params.toString();
    return query.length > 0 ? `/posts/${post.id}?${query}` : `/posts/${post.id}`;
  };

  const buildComposeHref = (parentDeepDiveId?: number) =>
    buildPostHref({
      nextComposeTarget: parentDeepDiveId ? "deepDive" : focusedRootDeepDive ? "focusRoot" : "post",
      nextComposeParentDeepDiveId: parentDeepDiveId,
    });

  const buildParentJumpHref = (parentDeepDiveId: number) => {
    const base = buildPostHref({ keepParentDeepDiveId: false });
    return `${base}#deepdive-${parentDeepDiveId}`;
  };

  const focusFilteredDeepDives = focusFlowIds
    ? post.deepDives.filter((deepDive) => focusFlowIds.has(deepDive.id))
    : post.deepDives;
  const filteredDeepDives = selectedType
    ? focusFilteredDeepDives.filter((deepDive) => deepDive.type === selectedType)
    : focusFilteredDeepDives;
  const focusCount = focusFlowIds?.size ?? null;
  const showInvalidFocusNotice = Boolean(focusFromDeepDiveId) && !hasValidFocusParam;
  const discoveryParts = [
    discoveryContext.q ? `「${discoveryContext.q}」を含む流れ` : null,
    discoveryContext.postType ? `${postTypeLabels[discoveryContext.postType]}の流れ` : null,
    discoveryContext.tag ? `タグ「${discoveryContext.tag}」` : null,
    discoveryContext.sort
      ? discoveryContext.sort === "new"
        ? "新着順"
        : discoveryContext.sort === "deep"
          ? "深堀り順"
          : "盛り上がり順"
      : null,
  ].filter(Boolean);
  const discoverySourceText =
    discoveryParts.length > 0
      ? `${discoveryParts.join(" / ")}の一覧から来ています。`
      : null;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-5">
      <PostRealtimeRefresh postId={post.id} />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">投稿の深堀り</h1>
        <div className="flex items-center gap-1">
          {fromMeEasyReplyWorkbench ? (
            <Link
              href="/me#me-easy-reply"
              data-testid="back-to-workbench"
              className="inline-flex h-7 items-center justify-center rounded-[10px] px-2.5 text-[0.8rem] font-medium text-indigo-900 transition hover:bg-indigo-50"
            >
              いま返しやすい流れへ戻る
            </Link>
          ) : null}
          <Link
            href={backToDiscoveryHref}
            data-testid="back-to-discovery"
            className="inline-flex h-7 items-center justify-center rounded-[10px] px-2.5 text-[0.8rem] font-medium transition hover:bg-zinc-100"
          >
            {hasDiscoverySource ? "この流れの一覧へ戻る" : "一覧へ戻る"}
          </Link>
        </div>
      </div>
      {hasDiscoverySource && discoverySourceText && (
        <p
          data-testid="discovery-context-note"
          className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800"
        >
          {discoverySourceText}
        </p>
      )}

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary">{postTypeLabels[post.type]}</Badge>
          <span className="text-xs text-zinc-500">{post.author.name}</span>
          <span className="text-xs text-zinc-500">{formatDateTimeJP(post.createdAt)}</span>
        </div>
        <h2 className="text-base font-semibold leading-7">{post.title}</h2>
        {post.isHidden ? (
          <p className="mt-2 text-sm leading-7 text-zinc-600">この流れは現在見えないようにしています。</p>
        ) : (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700">{post.body}</p>
        )}
        {post.isHidden ? null : (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.postTags.map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
        {session?.user && !post.isHidden ? (
          <ReportForm postId={post.id} targetType="POST" linkLabel="この流れを知らせる" />
        ) : null}
        {!post.isHidden ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 px-3 py-2">
            <div className="text-xs text-zinc-600">
              <p>また戻りたい流れは、手元に置いておけます。</p>
              {session?.user && isSavedByMe ? (
                <p data-testid="post-saved-badge" className="mt-0.5 text-emerald-700">
                  この流れは手元に置いています
                </p>
              ) : null}
              {session?.user && savedActivity?.isSaved && savedActivity.hasNewActivity ? (
                <p data-testid="post-saved-activity-note" className="mt-0.5 text-zinc-600">
                  前回見たあとに流れが動いています。
                </p>
              ) : null}
            </div>
            {session?.user ? (
              <form action={isSavedByMe ? unsaveAction : saveAction}>
                <button
                  type="submit"
                  data-testid="post-save-toggle"
                  className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium transition ${
                    isSavedByMe
                      ? "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                      : "bg-zinc-900 text-white hover:bg-zinc-700"
                  }`}
                >
                  {isSavedByMe ? "手元から外す" : "手元に置く"}
                </button>
              </form>
            ) : (
              <Link
                href={`/signin?callbackUrl=${encodeURIComponent(postDetailPathForLandingAuthReturn)}`}
                data-testid="post-save-signin-link"
                className="inline-flex h-8 items-center justify-center rounded-full border border-zinc-300 bg-white px-3 text-xs text-zinc-700 transition hover:bg-zinc-100"
              >
                入って手元に置く
              </Link>
            )}
          </div>
        ) : null}
        {!post.isHidden ? (
          <PostShareActions postTitle={post.title} shareUrl={shareUrl} shareText={shareText} />
        ) : null}
        {!post.isHidden && session?.user && savedActivity?.isSaved && savedActivity.hasNewActivity ? (
          <form action={markSeenAction} className="mt-2">
            <button
              type="submit"
              data-testid="post-mark-saved-seen"
              className="text-xs font-medium text-zinc-500 underline-offset-2 transition hover:text-zinc-700 hover:underline"
            >
              ここまで見たことにする
            </button>
          </form>
        ) : null}
        <p className="mt-4 text-xs text-zinc-500">
          ここはモヤモヤを深堀りしていく場所です。{" "}
          <Link href="/about" className="underline-offset-2 hover:text-zinc-700 hover:underline">
            助けっ人掲示板とは
          </Link>
        </p>
      </section>
      {!session?.user && !post.isHidden ? (
        <section
          data-testid="shared-landing-onboarding"
          className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3"
        >
          <h2 className="text-sm font-medium text-emerald-900">ここは、流れを深堀りする場所です。</h2>
          <p className="mt-1 text-xs leading-5 text-emerald-800">
            助けっ人掲示板は、答えを急がずに角度を重ねながら流れを読み進める掲示板です。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(postDetailPathForLandingAuthReturn)}`}
              data-testid="shared-landing-signup-cta"
              className="inline-flex h-8 items-center justify-center rounded-full bg-zinc-900 px-3.5 text-xs font-medium text-white transition hover:bg-zinc-700"
            >
              はじめる
            </Link>
            <Link
              href={`/signin?callbackUrl=${encodeURIComponent(postDetailPathForLandingAuthReturn)}`}
              data-testid="shared-landing-signin-cta"
              className="inline-flex h-8 items-center justify-center rounded-full border border-zinc-300 bg-white px-3.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              入る
            </Link>
            <Link
              href="/about"
              className="text-xs text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline"
            >
              助けっ人掲示板とは
            </Link>
          </div>
        </section>
      ) : null}

      <div className="my-5">
        <Separator />
        <p className="mt-3 text-sm font-medium text-zinc-600">深堀り {post.deepDives.length}</p>
        {focusedRootDeepDive && (
          <div
            data-testid="focus-flow-banner"
            className="mt-3 rounded-xl border bg-emerald-50/70 px-3 py-2"
          >
            <p className="text-xs font-medium text-emerald-800">
              この起点から重なった流れに絞っています
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              {focusedRootDeepDive.user.name}さん / {deepDiveTypeLabels[focusedRootDeepDive.type]}
              {focusCount ? ` / ${focusCount}件` : ""}
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-700">
              {excerpt(focusedRootDeepDive.body, 70)}
            </p>
            <Link
              href={buildPostHref({
                nextFocusFromDeepDiveId: null,
                nextComposeTarget: "post",
                keepParentDeepDiveId: false,
              })}
              className="mt-1 inline-flex text-xs text-emerald-700 underline-offset-2 hover:underline"
            >
              流れの絞り込みを外す
            </Link>
            <p className="mt-1 text-xs text-emerald-700">
              この流れの起点にそのまま重ねると、読み進めた流れの続きとして深堀りを置けます。
            </p>
          </div>
        )}
        {showInvalidFocusNotice && (
          <p className="mt-2 text-xs text-zinc-500">
            指定された起点は見つからなかったため、全体の流れを表示しています。
          </p>
        )}
        <div data-testid="type-filter-list" className="mt-3 flex flex-wrap gap-2">
          {filterItems.map((item) => {
            const isActive = (item.key === "ALL" && !selectedType) || selectedType === item.key;
            const href = buildPostHref({
              nextType: item.key === "ALL" ? null : item.key,
              keepParentDeepDiveId: true,
            });
            return (
              <Link
                key={item.key}
                href={href}
                data-testid={`type-filter-${item.key}`}
                data-active={isActive ? "true" : "false"}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <section data-testid="deepdive-list" className="space-y-3 pb-8">
        {post.deepDives.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-4 text-sm leading-6 text-zinc-600">
            まだ深堀りは重なっていません。最初の深堀りを置いてみてください。
          </div>
        ) : filteredDeepDives.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-4 text-sm leading-6 text-zinc-600">
            この種類の深堀りはまだ重なっていません。別の角度から深堀りを置いてみてください。
          </div>
        ) : (
          filteredDeepDives.map((deepDive, index) => (
            <DeepDiveBubble
              key={deepDive.id}
              deepDive={deepDive}
              index={index}
              stackHref={buildComposeHref(deepDive.id)}
              focusFlowHref={
                deepDive._count?.childDeepDives
                  ? buildPostHref({
                      nextFocusFromDeepDiveId: String(deepDive.id),
                      keepParentDeepDiveId: true,
                    })
                  : undefined
              }
              isActiveFocusRoot={focusedRootDeepDive?.id === deepDive.id}
              jumpToParentHref={
                deepDive.parentDeepDiveId ? buildParentJumpHref(deepDive.parentDeepDiveId) : undefined
              }
              reportSlot={
                session?.user && !deepDive.isHidden ? (
                  <ReportForm
                    postId={post.id}
                    targetType="DEEPDIVE"
                    targetDeepDiveId={deepDive.id}
                    linkLabel="この角度を知らせる"
                  />
                ) : null
              }
            />
          ))
        )}
      </section>

      {!session?.user && !post.isHidden ? (
        <p className="mt-6 text-xs text-zinc-500">
          この流れを読み終えたら、近い流れにも目を向けてみると別の角度が見えてきます。
        </p>
      ) : null}
      <RelatedFlowsSection
        items={relatedFlows}
        discoveryContext={discoveryContext}
        handDiscoveryByPostId={relatedHandDiscoveryByPostId}
        isGuestReader={!session?.user}
      />
      <InlineAdSlot
        slot={postBottomAdSlotId}
        className="mt-6"
        testId="post-inline-ad-slot"
      />

      {session?.user && !post.isHidden ? (
        <>
          {hasReturnedFromLandingAuth ? (
            <section
              data-testid="landing-auth-first-contribution"
              className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3"
            >
              <p className="text-sm font-medium text-emerald-900">
                戻ってきた流れに、まずは短い角度を1つ重ねてみませんか。
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                深い正解でなくて大丈夫です。いま見えた1つの見方を置くだけでも、流れは進みます。
              </p>
              <a
                href="#deepdive-form-section"
                data-testid="landing-auth-first-contribution-cta"
                className="mt-3 inline-flex h-8 items-center justify-center rounded-full border border-emerald-200 bg-white px-3.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-50"
              >
                この流れに最初の角度を置く
              </a>
            </section>
          ) : null}
          <DeepDiveForm
            key={`compose-${initialComposeParentDeepDiveId}-${initialComposeTarget}-${focusedRootDeepDive?.id ?? ""}`}
            postId={post.id}
            currentType={selectedType}
            currentFocusFromDeepDiveId={focusedRootDeepDive ? String(focusedRootDeepDive.id) : null}
            discoveryContext={discoveryContext}
            initialDeepDiveType={initialComposeType}
            initialTargetMode={initialComposeTarget}
            initialParentDeepDiveId={initialComposeParentDeepDiveId}
            showIncomingComposeHint={showIncomingComposeHint}
            showSavedActivityComposeHint={showSavedActivityComposeHint}
            showFirstContributionAssist={hasReturnedFromLandingAuth}
            workbenchContext={
              isMeEasyReplyStackCompose
                ? { source: "me", flow: "easyReply", returnTo: "me" }
                : null
            }
            focusRootDeepDive={
              focusedRootDeepDive
                ? {
                    id: focusedRootDeepDive.id,
                    body: focusedRootDeepDive.body,
                    type: focusedRootDeepDive.type,
                    user: focusedRootDeepDive.user,
                  }
                : null
            }
            selectedParentDeepDive={selectedParentDeepDive ?? null}
          />
        </>
      ) : !session?.user ? (
        <div
          data-testid="deepdive-login-prompt"
          className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-6 text-center shadow-sm"
        >
          <p className="text-sm leading-6 text-zinc-700">
            この流れに角度を置くには、入ってから重ねてください。
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href={`/signin?callbackUrl=${encodeURIComponent(postDetailPathForLandingAuthReturn)}`}
              data-testid="deepdive-signin-link"
              className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              入る
            </Link>
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(postDetailPathForLandingAuthReturn)}`}
              data-testid="deepdive-signup-link"
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              はじめる
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}
