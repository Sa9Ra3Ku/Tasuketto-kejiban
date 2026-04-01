import Link from "next/link";
import { ReportStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin";
import { excerpt, formatDateTimeJP } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { reportReasonLabel } from "@/lib/reports";

import {
  hideDeepDiveFromReportAction,
  hidePostFromReportAction,
  updateReportStatusAction,
} from "./actions";

export default async function AdminReportsPage() {
  const { session, isAdmin } = await getAdminSession();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Fadmin%2Freports");
  }
  if (!isAdmin) {
    redirect("/");
  }

  const reports = await prisma.report.findMany({
    where: { status: ReportStatus.OPEN },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      targetPost: { select: { id: true, title: true, body: true, isHidden: true } },
      targetDeepDive: {
        select: {
          id: true,
          postId: true,
          body: true,
          isHidden: true,
          post: { select: { title: true } },
        },
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-lg font-semibold">通報の確認</h1>
      <p className="mt-1 text-xs text-zinc-600">OPEN の知らせだけを表示しています。</p>
      <section className="mt-4 space-y-3">
        {reports.length === 0 ? (
          <div className="rounded-xl border bg-white p-4 text-sm text-zinc-600">いま確認待ちはありません。</div>
        ) : (
          reports.map((report) => {
            const targetHref =
              report.targetType === "POST" && report.targetPost
                ? `/posts/${report.targetPost.id}`
                : report.targetType === "DEEPDIVE" && report.targetDeepDive
                  ? `/posts/${report.targetDeepDive.postId}#deepdive-${report.targetDeepDive.id}`
                  : null;
            const targetText =
              report.targetType === "POST"
                ? report.targetPost
                  ? excerpt(report.targetPost.body, 100)
                  : "対象の流れは見つかりません"
                : report.targetDeepDive
                  ? excerpt(report.targetDeepDive.body, 100)
                  : "対象の角度は見つかりません";
            const hidePostAction =
              report.targetType === "POST" && report.targetPost
                ? hidePostFromReportAction.bind(null, report.targetPost.id, report.id)
                : null;
            const hideDeepDiveAction =
              report.targetType === "DEEPDIVE" && report.targetDeepDive
                ? hideDeepDiveFromReportAction.bind(
                    null,
                    report.targetDeepDive.id,
                    report.targetDeepDive.postId,
                    report.id,
                  )
                : null;
            return (
              <article key={report.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5">{report.targetType}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                    {reportReasonLabel(report.reasonKey)}
                  </span>
                  <span className="text-zinc-500">{formatDateTimeJP(report.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-800">{targetText}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  通報者: {report.reporter.name} ({report.reporter.email})
                </p>
                {targetHref ? (
                  <Link href={targetHref} className="mt-2 inline-flex text-xs text-zinc-600 hover:underline">
                    対象を見る
                  </Link>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={updateReportStatusAction.bind(null, report.id, ReportStatus.REVIEWED)}>
                    <button className="rounded-md border px-2.5 py-1 text-xs">REVIEWED にする</button>
                  </form>
                  <form action={updateReportStatusAction.bind(null, report.id, ReportStatus.DISMISSED)}>
                    <button className="rounded-md border px-2.5 py-1 text-xs">DISMISSED にする</button>
                  </form>
                  {hidePostAction ? (
                    <form action={hidePostAction}>
                      <button className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white">
                        この流れを見えないようにする
                      </button>
                    </form>
                  ) : null}
                  {hideDeepDiveAction ? (
                    <form action={hideDeepDiveAction}>
                      <button className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white">
                        この角度を見えないようにする
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

