import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EasyReplyFlowSection } from "@/components/me/easy-reply-flow-section";
import { IncomingOverlapsSection } from "@/components/me/incoming-overlaps-section";
import { MyDeepDivesSection } from "@/components/me/my-deepdives-section";
import { MyFlowsSection } from "@/components/me/my-flows-section";
import { SavedFlowActivitySection } from "@/components/me/saved-flow-activity-section";
import { SavedFlowsSection } from "@/components/me/saved-flows-section";
import { UserRealtimeRefresh } from "@/components/realtime/user-realtime-refresh";
import {
  attachIncomingOverlapNewness,
  buildEasyReplyFlowWorkbenchItems,
  getIncomingDeepDiveActivity,
  getIncomingOverlapInboxMeta,
  getMyDeepDives,
  getMyPosts,
  getSavedFlowActivity,
  getSavedPostsWithActivity,
} from "@/lib/me";
import { prisma } from "@/lib/prisma";
import { isSupporterMember, membershipLabel } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "自分の流れ | 助けっ人掲示板",
};

type Props = {
  searchParams: Promise<{
    fromPostedWorkbench?: string;
    postedFrom?: string;
  }>;
};

export default async function MePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/me")}`);
  }
  const { fromPostedWorkbench, postedFrom } = await searchParams;
  const showWorkbenchPostedNotice =
    fromPostedWorkbench === "1" && (postedFrom === "easyReply" || postedFrom === undefined);

  const { user } = session;
  const viewer = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      subscriptionPlanKey: true,
      subscriptionStatus: true,
    },
  });
  const easyReplyLimit = isSupporterMember(viewer ?? {}) ? 15 : 10;
  const [posts, deepDives, incomingOverlaps, inboxMeta, savedActivity, savedPosts] = await Promise.all([
    getMyPosts(user.id),
    getMyDeepDives(user.id),
    getIncomingDeepDiveActivity(user.id),
    getIncomingOverlapInboxMeta(user.id),
    getSavedFlowActivity(user.id),
    getSavedPostsWithActivity(user.id),
  ]);

  const newIncomingCount = inboxMeta.unconfirmedCount;
  const incomingWithNewness = attachIncomingOverlapNewness(incomingOverlaps, inboxMeta.seenAt);
  const easyReplyWorkbench = buildEasyReplyFlowWorkbenchItems(
    incomingOverlaps,
    savedActivity,
    easyReplyLimit,
  );

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8" data-testid="me-page">
      <UserRealtimeRefresh userId={user.id} testId="me-realtime-listener" />
      <header className="mb-8 border-b border-zinc-200/90 pb-6">
        <p className="text-xs font-medium text-zinc-500">今の自分</p>
        <h1 className="mt-1 text-lg font-semibold text-zinc-900">{user.name}</h1>
        {user.email ? (
          <p className="mt-0.5 truncate text-xs text-zinc-500">{user.email}</p>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          いま、返ってきた重なりと、自分が立てた流れ、重ねた角度をまとめて見ています。
        </p>
        <p className="mt-2 text-xs text-zinc-500" data-testid="me-membership-label">
          会員状態: {membershipLabel(viewer ?? {})}
          {" · "}
          <Link href="/billing" className="underline-offset-2 hover:text-zinc-800 hover:underline">
            会員と支払い
          </Link>
        </p>
        {newIncomingCount > 0 ? (
          <p
            className="mt-3 text-sm leading-relaxed text-zinc-600"
            data-testid="me-new-incoming-summary"
          >
            新しく返ってきた重なりが{" "}
            <span className="font-medium text-zinc-800">{newIncomingCount}</span> 件あります。
          </p>
        ) : null}
        {showWorkbenchPostedNotice ? (
          <p
            data-testid="me-workbench-posted-notice"
            className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs leading-relaxed text-indigo-900"
          >
            いま、ひとつ角度を重ねました。
          </p>
        ) : null}
      </header>

      <div className="space-y-8">
        <EasyReplyFlowSection items={easyReplyWorkbench} />
        <IncomingOverlapsSection items={incomingWithNewness} newIncomingCount={newIncomingCount} />
        <SavedFlowActivitySection items={savedActivity} />
        <SavedFlowsSection posts={savedPosts} />
        <MyFlowsSection posts={posts} />
        <MyDeepDivesSection items={deepDives} />
      </div>
    </main>
  );
}
