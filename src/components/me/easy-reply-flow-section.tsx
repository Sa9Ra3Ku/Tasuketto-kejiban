import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatDateTimeJP } from "@/lib/format";
import { incomingOverlapStackHref, incomingOverlapViewHref } from "@/lib/incoming-overlap-nav";
import { deepDiveTypeLabels } from "@/lib/labels";
import type { EasyReplyFlowWorkbenchItem } from "@/lib/me";

function withEasyReplyWorkbenchContext(href: string, opts?: { composeFromWorkbench?: "easyReply" }) {
  const [pathWithQuery, hash = ""] = href.split("#");
  const [path, query = ""] = pathWithQuery.split("?");
  const params = new URLSearchParams(query);
  params.set("workbenchSource", "me");
  params.set("workbenchFlow", "easyReply");
  params.set("returnTo", "me");
  if (opts?.composeFromWorkbench) {
    params.set("composeFromWorkbench", opts.composeFromWorkbench);
  }
  const nextQuery = params.toString();
  return `${path}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

function savedActivityStackHref(postId: number, deepDiveId: number): string {
  const params = new URLSearchParams();
  params.set("composeTarget", "deepDive");
  params.set("composeParentDeepDiveId", String(deepDiveId));
  params.set("composeSource", "savedActivity");
  return `/posts/${postId}?${params.toString()}#deepdive-${deepDiveId}`;
}

type Props = {
  items: EasyReplyFlowWorkbenchItem[];
};

export function EasyReplyFlowSection({ items }: Props) {
  return (
    <section
      id="me-easy-reply"
      data-testid="me-easy-reply-section"
      className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
      aria-labelledby="me-easy-reply-heading"
    >
      <div className="mb-3">
        <h2 id="me-easy-reply-heading" className="text-sm font-semibold text-zinc-900">
          いま返しやすい流れ
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          返すと流れが育ちそうなところだけ、手早くまとめています。
        </p>
      </div>

      {items.length > 0 ? (
        <p
          className="mb-3 text-xs text-zinc-500"
          data-testid="me-easy-reply-summary"
        >
          いま返しやすい流れが{" "}
          <span className="font-medium text-zinc-700">{items.length}</span>{" "}
          件あります。
        </p>
      ) : null}

      {items.length === 0 ? (
        <div
          data-testid="me-easy-reply-empty"
          className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-4 text-center"
        >
          <p className="text-sm text-zinc-600">今すぐ返したい流れは、まだここには出ていません。</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            流れに角度を置いたり、手元に置いたりすると、ここに返しやすい流れが見えてきます。
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const viewHref =
              item.source === "incomingOverlap"
                ? incomingOverlapViewHref(item.postId, item.deepDiveId)
                : `/posts/${item.postId}#deepdive-${item.deepDiveId}`;
            const stackHref =
              item.source === "incomingOverlap"
                ? incomingOverlapStackHref(item.postId, item.deepDiveId)
                : savedActivityStackHref(item.postId, item.deepDiveId);
            const viewHrefFromWorkbench = withEasyReplyWorkbenchContext(viewHref);
            const stackHrefFromWorkbench = withEasyReplyWorkbenchContext(stackHref, {
              composeFromWorkbench: "easyReply",
            });
            return (
              <li
                key={`${item.source}-${item.postId}-${item.deepDiveId}`}
                className="rounded-xl border border-zinc-200/90 bg-zinc-50/40 p-3 transition hover:border-zinc-300 hover:bg-white/90"
              >
                <p className="text-[11px] leading-relaxed text-zinc-600">{item.contextLine}</p>
                <p className="mt-1.5 text-xs text-zinc-700">{item.detailLine}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-medium">
                    {deepDiveTypeLabels[item.deepDiveType]}
                  </Badge>
                  <span className="text-[11px] text-zinc-400">{formatDateTimeJP(item.activityAt)}</span>
                </div>
                <Link
                  href={viewHrefFromWorkbench}
                  data-testid={`me-easy-reply-view-${item.deepDiveId}`}
                  className="group mt-2 block rounded-lg outline-none ring-zinc-300 transition focus-visible:ring-2"
                >
                  <p className="text-sm font-medium leading-6 text-zinc-900 group-hover:text-zinc-950">
                    {item.postTitle}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-700 group-hover:text-zinc-800">
                    {item.excerptLine}
                  </p>
                </Link>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-zinc-200/80 pt-2.5">
                  <Link
                    href={viewHrefFromWorkbench}
                    className="text-[11px] font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
                  >
                    この角度を見る
                  </Link>
                  <span className="text-zinc-300" aria-hidden>
                    ·
                  </span>
                  <Link
                    href={stackHrefFromWorkbench}
                    data-testid={`me-easy-reply-stack-${item.deepDiveId}`}
                    className="inline-flex items-center rounded-full border border-indigo-200/90 bg-indigo-50/80 px-2.5 py-0.5 text-[11px] font-medium text-indigo-900 transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    さらに重ねる
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
