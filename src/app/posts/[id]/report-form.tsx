"use client";

import { useActionState } from "react";

import { reportReasonItems } from "@/lib/reports";

import { createReportAction, type ReportFormState } from "./actions";

type Props = {
  postId: number;
  targetType: "POST" | "DEEPDIVE";
  targetDeepDiveId?: number;
  linkLabel: string;
};

const initialState: ReportFormState = {};

export function ReportForm({ postId, targetType, targetDeepDiveId, linkLabel }: Props) {
  const action = createReportAction.bind(null, postId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs text-zinc-500 underline-offset-2 hover:underline">
        {linkLabel}
      </summary>
      <form action={formAction} className="mt-2 space-y-2 rounded-lg border bg-zinc-50 p-3">
        <input type="hidden" name="targetType" value={targetType} />
        {targetDeepDiveId ? <input type="hidden" name="targetDeepDiveId" value={targetDeepDiveId} /> : null}
        <label className="block text-xs text-zinc-700">
          理由
          <select
            name="reasonKey"
            required
            className="mt-1 h-8 w-full rounded-md border bg-white px-2 text-xs"
            defaultValue=""
          >
            <option value="" disabled>
              選んでください
            </option>
            {reportReasonItems.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-zinc-700">
          補足（任意）
          <textarea
            name="note"
            rows={2}
            maxLength={600}
            className="mt-1 w-full rounded-md border bg-white px-2 py-1.5 text-xs"
            placeholder="必要なら短く書いてください"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-8 items-center justify-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white disabled:opacity-60"
        >
          {isPending ? "送信中..." : "運営へ伝える"}
        </button>
        {state.errors?.reasonKey ? <p className="text-xs text-rose-600">{state.errors.reasonKey}</p> : null}
        {state.errors?.note ? <p className="text-xs text-rose-600">{state.errors.note}</p> : null}
        {state.errors?.form ? <p className="text-xs text-rose-600">{state.errors.form}</p> : null}
        {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
      </form>
    </details>
  );
}

