import { DeepDive } from "@prisma/client";
import Link from "next/link";
import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { excerpt, formatDateTimeJP } from "@/lib/format";
import { deepDiveTypeLabels } from "@/lib/labels";

type DeepDiveWithUser = DeepDive & {
  user: {
    name: string;
  };
  _count?: {
    childDeepDives: number;
  };
  parentDeepDive: (DeepDive & {
    user: {
      name: string;
    };
  }) | null;
};

type Props = {
  deepDive: DeepDiveWithUser;
  index: number;
  stackHref: string;
  jumpToParentHref?: string;
  focusFlowHref?: string;
  isActiveFocusRoot?: boolean;
  reportSlot?: ReactNode;
};

const typeToneClass: Record<DeepDive["type"], string> = {
  EMPATHY: "bg-rose-50 text-rose-700 border-rose-100",
  PERSPECTIVE: "bg-sky-50 text-sky-700 border-sky-100",
  HYPOTHESIS: "bg-violet-50 text-violet-700 border-violet-100",
  DEDUCTION: "bg-indigo-50 text-indigo-700 border-indigo-100",
  REBUTTAL: "bg-amber-50 text-amber-700 border-amber-100",
  SUMMARY: "bg-zinc-100 text-zinc-700 border-zinc-200",
  EXPERIENCE: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export function DeepDiveBubble({
  deepDive,
  index,
  stackHref,
  jumpToParentHref,
  focusFlowHref,
  isActiveFocusRoot = false,
  reportSlot,
}: Props) {
  const isRight = index % 2 === 1;
  const initial = deepDive.user.name.slice(0, 1);
  const childDeepDiveCount = deepDive._count?.childDeepDives ?? 0;

  return (
    <div
      id={`deepdive-${deepDive.id}`}
      data-testid={`deepdive-item-${deepDive.id}`}
      data-deepdive-type={deepDive.type}
      className={`deepdive-anchor flex ${isRight ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isRight ? "bg-emerald-100" : "bg-white border"
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700">
              {initial}
            </span>
            <span className="text-xs font-medium text-zinc-700">{deepDive.user.name}</span>
          </div>
          <span className="text-[11px] text-zinc-500">{formatDateTimeJP(deepDive.createdAt)}</span>
        </div>
        <div className="mb-2">
          <Badge
            variant="outline"
            data-testid={`deepdive-type-${deepDive.id}`}
            className={`border text-[11px] font-medium ${typeToneClass[deepDive.type]}`}
          >
            {deepDiveTypeLabels[deepDive.type]}
          </Badge>
          {childDeepDiveCount > 0 && (
            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
              この深堀りを起点に {childDeepDiveCount}件 重なっています
            </p>
          )}
        </div>
        {deepDive.isHidden ? (
          <p className="text-sm leading-6 text-zinc-600">この角度は現在見えないようにしています。</p>
        ) : (
          <p className="text-sm leading-6 text-zinc-800">{deepDive.body}</p>
        )}
        {deepDive.parentDeepDive && (
          <div className="mt-2 rounded-lg border bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            <p className="font-medium">
              {deepDive.parentDeepDive.user.name}さんの{" "}
              {deepDiveTypeLabels[deepDive.parentDeepDive.type]} に重ねた深堀り
            </p>
            <p className="mt-1 leading-5 text-zinc-500">{excerpt(deepDive.parentDeepDive.body, 60)}</p>
            {jumpToParentHref && (
              <Link
                href={jumpToParentHref}
                className="mt-1 inline-flex text-xs text-zinc-500 underline-offset-2 hover:underline"
              >
                重なり元へジャンプ
              </Link>
            )}
          </div>
        )}
        {deepDive.parentDeepDiveId && !deepDive.parentDeepDive && (
          <div className="mt-2 rounded-lg border bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            重なり元は今ここでは辿れません。
          </div>
        )}
        {deepDive.isHidden ? null : (
          <div className="mt-2">
            <Link
              href={stackHref}
              data-testid={`stack-to-deepdive-${deepDive.id}`}
              className="text-xs text-zinc-500 underline-offset-2 hover:underline"
            >
              この深堀りに重ねる
            </Link>
            {childDeepDiveCount > 0 && focusFlowHref && (
              <div className="mt-1">
                {isActiveFocusRoot ? (
                  <span className="text-xs text-zinc-400">この起点からの流れを表示中</span>
                ) : (
                  <Link
                    href={focusFlowHref}
                    className="text-xs text-zinc-500 underline-offset-2 hover:underline"
                  >
                    この起点からの流れを見る
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
        {reportSlot}
      </div>
    </div>
  );
}
