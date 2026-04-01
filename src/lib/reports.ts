import { ReportReasonKey } from "@prisma/client";

export const reportReasonItems: Array<{ key: ReportReasonKey; label: string }> = [
  { key: "ATTACK", label: "攻撃的な内容" },
  { key: "HARASSMENT", label: "嫌がらせ・威圧" },
  { key: "SPAM", label: "宣伝・繰り返し投稿" },
  { key: "SEXUAL", label: "性的な内容" },
  { key: "ILLEGAL", label: "違法行為につながる内容" },
  { key: "OTHER", label: "その他" },
];

export function reportReasonLabel(key: ReportReasonKey): string {
  const found = reportReasonItems.find((item) => item.key === key);
  return found?.label ?? key;
}

