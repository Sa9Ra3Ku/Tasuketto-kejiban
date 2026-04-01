"use client";

import { useMemo, useState } from "react";

type Props = {
  postTitle: string;
  shareUrl: string;
  shareText: string;
};

export function PostShareActions({ postTitle, shareUrl, shareText }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const canNativeShare = useMemo(
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    [],
  );

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => {
      setFeedback(null);
    }, 2200);
  };

  const handleCopy = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      showFeedback("この流れのURLを控えました");
      return;
    }
    showFeedback("この環境ではコピーできませんでした");
  };

  const handleShare = async () => {
    if (!canNativeShare) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({
        title: postTitle,
        text: shareText,
        url: shareUrl,
      });
      showFeedback("この流れを渡しました");
    } catch {
      // cancel 時は静かに終了し、失敗時だけコピーへ寄せる
      await handleCopy();
    }
  };

  return (
    <section
      data-testid="post-share-panel"
      className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/70 px-3 py-2.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-zinc-600">
          <p>この流れを外へ渡しやすくしています。</p>
          <p className="mt-0.5 text-zinc-500">気になった角度を、そのまま見てもらえます。</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canNativeShare ? (
            <button
              type="button"
              onClick={handleShare}
              data-testid="post-share-native-button"
              className="inline-flex h-8 items-center justify-center rounded-full bg-zinc-900 px-3 text-xs font-medium text-white transition hover:bg-zinc-700"
            >
              この流れを共有する
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleCopy}
            data-testid="post-share-copy-button"
            className="inline-flex h-8 items-center justify-center rounded-full border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            URLを控える
          </button>
        </div>
      </div>
      {feedback ? (
        <p data-testid="post-share-feedback" className="mt-2 text-[11px] text-emerald-700">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
