"use client";

import { useActionState, useMemo, useState } from "react";
import { DeepDiveType } from "@prisma/client";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DiscoveryContext } from "@/lib/discovery-context";
import {
  deepDiveStarterChips,
  deepDiveTypeDescriptions,
  deepDiveTypeGuides,
  deepDiveTypePlaceholders,
} from "@/lib/deepdive-writing";
import { deepDiveTypeLabels } from "@/lib/labels";

import { createDeepDive, DeepDiveFormState } from "./actions";

type Props = {
  postId: number;
  currentType: string | null;
  currentFocusFromDeepDiveId: string | null;
  discoveryContext: DiscoveryContext;
  initialDeepDiveType: string;
  initialTargetMode: "post" | "focusRoot" | "deepDive";
  initialParentDeepDiveId: string;
  /** `/me` の返りから「そのまま重ねる」で開いたときだけ */
  showIncomingComposeHint?: boolean;
  /** 手元で新しく動いた流れから「さらに重ねる」で開いたときだけ */
  showSavedActivityComposeHint?: boolean;
  /** shared landing から signup/signin 復帰直後のみ */
  showFirstContributionAssist?: boolean;
  workbenchContext?: {
    source: "me";
    flow: "easyReply";
    returnTo: "me";
  } | null;
  focusRootDeepDive: {
    id: number;
    body: string;
    type: DeepDiveType;
    user: { name: string };
  } | null;
  selectedParentDeepDive: {
    id: number;
    body: string;
    type: DeepDiveType;
    user: { name: string };
  } | null;
};

const MIN_BODY_LENGTH = 3;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      data-testid="compose-submit"
      className="w-full rounded-full"
      disabled={pending}
    >
      {pending ? "深堀りを重ねています..." : "深堀りを追加"}
    </Button>
  );
}

export function DeepDiveForm({
  postId,
  currentType,
  currentFocusFromDeepDiveId,
  discoveryContext,
  initialDeepDiveType,
  initialTargetMode,
  initialParentDeepDiveId,
  showIncomingComposeHint = false,
  showSavedActivityComposeHint = false,
  showFirstContributionAssist = false,
  workbenchContext = null,
  focusRootDeepDive,
  selectedParentDeepDive,
}: Props) {
  const actionWithPostIdAndType = createDeepDive.bind(
    null,
    postId,
    currentType,
    currentFocusFromDeepDiveId,
    discoveryContext,
    workbenchContext,
  );
  const initialState: DeepDiveFormState = {
    errors: {},
    values: {
      type: initialDeepDiveType,
      body: "",
      targetMode: initialTargetMode,
      parentDeepDiveId: initialParentDeepDiveId,
    },
  };
  const [state, formAction] = useActionState(actionWithPostIdAndType, initialState);

  const [selectedType, setSelectedType] = useState(state.values?.type ?? initialDeepDiveType);
  const [body, setBody] = useState(state.values?.body ?? "");
  const [targetMode, setTargetMode] = useState(
    (state.values?.targetMode as "post" | "focusRoot" | "deepDive" | undefined) ?? initialTargetMode,
  );
  const [selectedParentId] = useState(state.values?.parentDeepDiveId ?? initialParentDeepDiveId);

  const activeType = useMemo(
    () =>
      Object.values(DeepDiveType).includes(selectedType as DeepDiveType)
        ? (selectedType as DeepDiveType)
        : null,
    [selectedType],
  );

  const chips = activeType ? deepDiveStarterChips[activeType] : [];
  const typeDescription = activeType
    ? deepDiveTypeDescriptions[activeType]
    : "いま置きたい角度を選ぶと、書き出しの補助が表示されます。";
  const typeGuide = activeType
    ? deepDiveTypeGuides[activeType]
    : "短くても、角度がはっきりしていれば深堀りとして重なっていきます。";
  const basePlaceholder = activeType
    ? deepDiveTypePlaceholders[activeType]
    : "あなたの深堀りを言葉にしてください";
  const placeholder = showFirstContributionAssist
    ? `まずは一言でも大丈夫です。${basePlaceholder}`
    : basePlaceholder;
  const remaining = Math.max(0, MIN_BODY_LENGTH - body.length);

  const appendStarter = (starter: string) => {
    const next = body.trim().length === 0 ? starter : `${body}\n${starter}`;
    setBody(next);
  };

  return (
    <section
      id="deepdive-form-section"
      data-testid="deepdive-form"
      className="mt-6 rounded-2xl border bg-white p-4 shadow-sm"
    >
      {showSavedActivityComposeHint ? (
        <p
          data-testid="compose-saved-activity-hint"
          className="mb-3 rounded-lg border border-teal-100/70 bg-teal-50/35 px-3 py-2 text-[11px] leading-relaxed text-teal-900/85"
        >
          手元で新しく動いた角度に、そのままさらに重ねられます。
        </p>
      ) : null}
      {showIncomingComposeHint ? (
        <p
          data-testid="compose-incoming-hint"
          className="mb-3 rounded-lg border border-indigo-100/80 bg-indigo-50/50 px-3 py-2 text-[11px] leading-relaxed text-indigo-900/90"
        >
          自分へ返ってきた角度に、そのままさらに重ねられます。無理にまとめなくて大丈夫です。
        </p>
      ) : null}
      <h3 className="text-sm font-semibold">この投稿に深堀りを重ねる</h3>
      <p className="mt-1 text-xs text-zinc-600">
        共感・視点・仮説などを持ち寄って、モヤモヤの輪郭をはっきりさせていきます。
      </p>
      {showFirstContributionAssist ? (
        <p
          data-testid="landing-auth-writing-assist"
          className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
        >
          この流れのどこが引っかかったか、まずは短く置く書き出しでも大丈夫です。
        </p>
      ) : null}

      <form action={formAction} className="mt-4 space-y-3">
        <input data-testid="target-mode-input" type="hidden" name="targetMode" value={targetMode} />
        <input
          data-testid="parent-deepdive-input"
          type="hidden"
          name="parentDeepDiveId"
          value={targetMode === "deepDive" ? selectedParentId : ""}
        />

        {currentFocusFromDeepDiveId && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            今はこの起点から広がった流れを見ています。投稿対象からこの流れの起点へそのまま重ねられます。
          </p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">投稿対象</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTargetMode("post")}
              data-testid="target-mode-post"
              data-active={targetMode === "post" ? "true" : "false"}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                targetMode === "post"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              投稿全体に重ねる
            </button>
            <button
              type="button"
              onClick={() => focusRootDeepDive && setTargetMode("focusRoot")}
              disabled={!focusRootDeepDive}
              data-testid="target-mode-focus-root"
              data-active={targetMode === "focusRoot" ? "true" : "false"}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                targetMode === "focusRoot"
                  ? "border-emerald-700 bg-emerald-600 text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              この流れの起点に重ねる
            </button>
            <button
              type="button"
              onClick={() => selectedParentDeepDive && setTargetMode("deepDive")}
              disabled={!selectedParentDeepDive}
              data-testid="target-mode-deepdive"
              data-active={targetMode === "deepDive" ? "true" : "false"}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                targetMode === "deepDive"
                  ? "border-indigo-700 bg-indigo-600 text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              選択中の深堀りに重ねる
            </button>
          </div>
        </div>

        {targetMode === "focusRoot" && focusRootDeepDive && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
            <p className="text-xs font-medium text-emerald-800">この流れの起点に重ねます</p>
            <p className="mt-1 text-xs text-emerald-700">
              {focusRootDeepDive.user.name}さん / {deepDiveTypeLabels[focusRootDeepDive.type]}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-emerald-700">{focusRootDeepDive.body}</p>
          </div>
        )}

        {selectedParentDeepDive && (
          <div data-testid="selected-parent-preview" className="rounded-xl border bg-zinc-50 p-3">
            <p className="text-xs font-medium text-zinc-700">
              {targetMode === "deepDive"
                ? "今はこの深堀りに重ねています"
                : "選択中の深堀り（必要ならここに重ねられます）"}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              {selectedParentDeepDive.user.name}さん / {deepDiveTypeLabels[selectedParentDeepDive.type]}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
              {selectedParentDeepDive.body}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTargetMode("focusRoot")}
                disabled={!focusRootDeepDive}
                className="text-xs text-zinc-500 underline-offset-2 hover:underline disabled:no-underline disabled:opacity-50"
              >
                この流れの起点に戻す
              </button>
              <button
                type="button"
                onClick={() => setTargetMode("post")}
                className="text-xs text-zinc-500 underline-offset-2 hover:underline"
              >
                投稿全体に戻す
              </button>
            </div>
          </div>
        )}
        {state.errors?.targetMode && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{state.errors.targetMode}</p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="type" className="text-sm font-medium">
            深堀り種別
          </label>
          <select
            id="type"
            name="type"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            required
          >
            <option value="" disabled>
              深堀り種別を選択
            </option>
            {Object.values(DeepDiveType).map((type) => (
              <option key={type} value={type}>
                {deepDiveTypeLabels[type]}
              </option>
            ))}
          </select>
          {state.errors?.type && (
            <p className="text-xs text-red-600">{state.errors.type}</p>
          )}
          <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">{typeDescription}</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="body" className="text-sm font-medium">
            本文
          </label>
          <Textarea
            id="body"
            name="body"
            rows={4}
            placeholder={placeholder}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
          />
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => appendStarter(chip)}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 transition hover:bg-zinc-200"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-zinc-500">{typeGuide}</p>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>結論よりも、いま見えている角度を置くイメージで書けます。</span>
            <span>
              {body.length}文字
              {remaining > 0 ? `（あと${remaining}文字で投稿可能）` : "（投稿可能）"}
            </span>
          </div>
          {state.errors?.body && (
            <p className="text-xs text-red-600">{state.errors.body}</p>
          )}
        </div>

        {state.errors?.form && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {state.errors.form}
          </p>
        )}
        {state.errors?.parentDeepDiveId && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {state.errors.parentDeepDiveId}
          </p>
        )}

        <SubmitButton />
      </form>
    </section>
  );
}
