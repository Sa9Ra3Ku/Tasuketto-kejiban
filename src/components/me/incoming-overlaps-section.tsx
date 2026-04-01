import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { MarkIncomingOverlapsSeenForm } from "@/components/me/mark-incoming-overlaps-seen-form";
import { excerpt, formatDateTimeJP } from "@/lib/format";
import { incomingOverlapStackHref, incomingOverlapViewHref } from "@/lib/incoming-overlap-nav";
import { deepDiveTypeLabels } from "@/lib/labels";
import type { IncomingDeepDiveActivityWithNew } from "@/lib/me";

type IncomingKind = IncomingDeepDiveActivityWithNew["kind"];

type Props = {
  items: IncomingDeepDiveActivityWithNew[];
  newIncomingCount: number;
};

function kindHint(kind: IncomingKind): string {
  if (kind === "onMyAngle") {
    return "あなたが置いた角度に、さらに重なっています";
  }
  return "あなたの流れに、誰かの角度が重なっています";
}

export function IncomingOverlapsSection({ items, newIncomingCount }: Props) {
  return (
    <section
      data-testid="me-incoming-overlaps-section"
      className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
      aria-labelledby="me-incoming-heading"
    >
      <div className="mb-3">
        <h2 id="me-incoming-heading" className="text-sm font-semibold text-zinc-900">
          自分へ返ってきた重なり
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          自分の流れや、自分が置いた角度の上に、ほかの人が深堀りを重ねてくれた場所です。
        </p>
      </div>

      <MarkIncomingOverlapsSeenForm show={items.length > 0 && newIncomingCount > 0} />

      {items.length === 0 ? (
        <div
          data-testid="me-incoming-overlaps-empty"
          className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-4 text-center"
        >
          <p className="text-sm text-zinc-600">
            まだ、あなたの流れや角度へ返ってきた重なりはありません。
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            流れを立てたり、角度を置いてみると、そこからまた違う見方が重なることがあります。
          </p>
          <p className="mt-3">
            <Link href="/posts/new" className="text-xs font-medium text-zinc-700 underline-offset-2 hover:underline">
              流れを始める
            </Link>
            <span className="mx-1.5 text-zinc-300">·</span>
            <Link href="/" className="text-xs text-zinc-600 underline-offset-2 hover:underline">
              流れを読みに行く
            </Link>
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const viewHref = incomingOverlapViewHref(item.post.id, item.id);
            const stackHref = incomingOverlapStackHref(item.post.id, item.id);
            const cardClass = item.isNew
              ? "rounded-xl border border-emerald-200/70 bg-emerald-50/25 p-3 shadow-[inset_3px_0_0_0] shadow-emerald-400/35"
              : "rounded-xl border border-zinc-200 bg-zinc-50/50 p-3";
            return (
              <li key={item.id}>
                <div className={`${cardClass} transition hover:border-zinc-300/90 hover:bg-white/80`}>
                  {item.isNew ? (
                    <div
                      className="flex flex-wrap items-center gap-2"
                      data-testid={`me-incoming-item-new-${item.id}`}
                    >
                      <Badge
                        variant="outline"
                        className="border-emerald-200/80 bg-white/80 px-1.5 py-0 text-[10px] font-semibold text-emerald-800"
                      >
                        新着
                      </Badge>
                      <p className="text-[11px] leading-5 text-emerald-800/90">新しく返ってきました</p>
                    </div>
                  ) : (
                    <p className="text-[11px] leading-5 text-emerald-700/90">{kindHint(item.kind)}</p>
                  )}
                  {!item.isNew ? null : (
                    <p className="mt-1.5 text-[11px] leading-5 text-emerald-700/85">{kindHint(item.kind)}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {deepDiveTypeLabels[item.type]}
                    </Badge>
                    <span className="text-[11px] font-medium text-zinc-700">{item.overlappedByName}</span>
                    <span className="text-[11px] text-zinc-500">{formatDateTimeJP(item.createdAt)}</span>
                  </div>
                  <Link
                    href={viewHref}
                    data-testid={`me-incoming-overlap-view-${item.id}`}
                    className="group mt-2 block rounded-lg outline-none ring-zinc-300 transition focus-visible:ring-2"
                  >
                    <p className="line-clamp-2 text-sm font-medium leading-6 text-zinc-900 group-hover:text-zinc-950">
                      {item.post.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-700 group-hover:text-zinc-800">
                      {excerpt(item.body, 100)}
                    </p>
                  </Link>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-zinc-200/80 pt-2.5">
                    <Link
                      href={viewHref}
                      className="text-[11px] font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
                    >
                      元の位置を見る
                    </Link>
                    <span className="text-zinc-300" aria-hidden>
                      ·
                    </span>
                    <Link
                      href={stackHref}
                      data-testid={`me-incoming-overlap-stack-${item.id}`}
                      className="inline-flex items-center rounded-full border border-indigo-200/90 bg-indigo-50/80 px-2.5 py-0.5 text-[11px] font-medium text-indigo-900 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      この角度にさらに重ねる
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
