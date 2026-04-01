export function formatDateTimeJP(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function excerpt(text: string, max = 90): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}
