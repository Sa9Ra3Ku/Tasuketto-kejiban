import { markIncomingOverlapsSeenAction } from "@/app/me/actions";

type Props = {
  /** 未確認がなくなったら出さない */
  show: boolean;
};

export function MarkIncomingOverlapsSeenForm({ show }: Props) {
  if (!show) return null;

  return (
    <form action={markIncomingOverlapsSeenAction} className="mb-3">
      <button
        type="submit"
        data-testid="me-mark-incoming-seen"
        className="text-xs font-medium text-zinc-500 underline-offset-4 transition hover:text-zinc-700 hover:underline"
      >
        ここまで見たことにする
      </button>
    </form>
  );
}
