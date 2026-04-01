import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatDateTimeJP } from "@/lib/format";
import { deepDiveTypeLabels, postTypeLabels } from "@/lib/labels";
import type { SavedFlowActivityItem } from "@/lib/me";

type Props = {
  items: SavedFlowActivityItem[];
};

export function SavedFlowActivitySection({ items }: Props) {
  return (
    <section
      data-testid="me-saved-activity-section"
      className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
      aria-labelledby="me-saved-activity-heading"
    >
      <div className="mb-3">
        <h2 id="me-saved-activity-heading" className="text-sm font-semibold text-zinc-900">
          手元で新しく動いた流れ
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          手元に置いた流れのうち、前回見たあとに角度が重なったものです。
        </p>
      </div>

      {items.length === 0 ? (
        <div
          data-testid="me-saved-activity-empty"
          className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-4 text-center"
        >
          <p className="text-sm text-zinc-600">今は手元で新しく動いた流れはありません。</p>
          <p className="mt-1 text-xs text-zinc-500">
            手元に置いた流れが動くと、ここに見えてきます。
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const latest = item.latestNewDeepDive;
            const stackHref =
              latest != null
                ? `/posts/${item.post.id}?composeTarget=deepDive&composeParentDeepDiveId=${latest.id}&composeSource=savedActivity#deepdive-${latest.id}`
                : null;
            const angleHref =
              latest != null ? `/posts/${item.post.id}#deepdive-${latest.id}` : `/posts/${item.post.id}`;

            return (
              <li
                key={item.post.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 transition hover:border-zinc-300 hover:bg-white"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[11px]">
                    {postTypeLabels[item.post.type]}
                  </Badge>
                  <span className="text-[11px] text-zinc-500">
                    最終更新 {formatDateTimeJP(item.post.updatedAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-zinc-900">{item.post.title}</p>
                <p className="mt-1 text-xs text-zinc-600">{item.reasonLine}</p>
                {latest ? (
                  <p
                    data-testid={`me-saved-activity-latest-excerpt-${item.post.id}`}
                    className="mt-2 text-xs leading-relaxed text-zinc-700"
                  >
                    最新の重なり: {latest.userName}さん / {deepDiveTypeLabels[latest.type]} /{" "}
                    {latest.bodyExcerpt}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    href={`/posts/${item.post.id}`}
                    data-testid={`me-saved-activity-link-${item.post.id}`}
                    className="text-xs font-medium text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline"
                  >
                    流れを開く
                  </Link>
                  {latest ? (
                    <>
                      <Link
                        href={angleHref}
                        data-testid={`me-saved-activity-view-new-angle-${item.post.id}`}
                        className="text-xs font-medium text-zinc-700 underline-offset-2 transition hover:text-zinc-900 hover:underline"
                      >
                        新しく動いた角度を見る
                      </Link>
                      {stackHref ? (
                        <Link
                          href={stackHref}
                          data-testid={`me-saved-activity-stack-new-angle-${item.post.id}`}
                          className="text-xs font-medium text-emerald-800/90 underline-offset-2 transition hover:underline"
                        >
                          この新しい角度にさらに重ねる
                        </Link>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
