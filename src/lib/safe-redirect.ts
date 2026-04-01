/** 同一オリジン内の相対パスのみ許可（オープンリダイレクト防止） */
export function safeRedirectPath(raw: string | null | undefined): string {
  if (raw == null || typeof raw !== "string") return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (trimmed.includes("\n") || trimmed.includes("\r")) return "/";
  return trimmed;
}
