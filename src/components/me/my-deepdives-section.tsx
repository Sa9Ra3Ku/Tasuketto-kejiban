import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { excerpt, formatDateTimeJP } from "@/lib/format";
import { deepDiveTypeLabels } from "@/lib/labels";
import type { MyDeepDiveListItem } from "@/lib/me";

type Props = {
  items: MyDeepDiveListItem[];
};

export function MyDeepDivesSection({ items }: Props) {
  return (
    <section
      data-testid="me-my-deepdives-section"
      className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
      aria-labelledby="me-deepdives-heading"
    >
      <div className="mb-3">
        <h2 id="me-deepdives-heading" className="text-sm font-semibold text-zinc-900">
          自分が重ねた角度
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">自分の名前で置いた深堀りです。</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-4 text-center">
          <p className="text-sm text-zinc-600">まだ自分の名前で置いた角度はありません。</p>
          <p className="mt-2">
            <Link href="/" className="text-xs text-zinc-600 underline-offset-2 hover:underline">
              流れを読みに行く
            </Link>
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((dive) => {
            const href = `/posts/${dive.post.id}#deepdive-${dive.id}`;
            const parent = dive.parentDeepDive;
            return (
              <li key={dive.id}>
                <Link
                  href={href}
                  data-testid={`me-deepdive-link-${dive.id}`}
                  className="block rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 transition hover:border-zinc-300 hover:bg-white"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {deepDiveTypeLabels[dive.type]}
                    </Badge>
                    <span className="text-[11px] text-zinc-500">{formatDateTimeJP(dive.createdAt)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-800">{excerpt(dive.body, 100)}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    流れ:{" "}
                    <span className="font-medium text-zinc-700">{dive.post.title}</span>
                  </p>
                  {parent && (
                    <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                      {parent.user.name}さんの{deepDiveTypeLabels[parent.type]}に重ねた角度
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
