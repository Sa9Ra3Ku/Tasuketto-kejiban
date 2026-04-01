import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || process.env[key]) continue;
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const requiredEnv = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "NEXT_PUBLIC_SITE_URL",
  "ADMIN_EMAILS",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_SUPPORTER",
  "PUSHER_APP_ID",
  "PUSHER_KEY",
  "PUSHER_SECRET",
  "PUSHER_CLUSTER",
  "NEXT_PUBLIC_PUSHER_KEY",
  "NEXT_PUBLIC_PUSHER_CLUSTER",
];

const optionalEnv = [
  "NEXT_PUBLIC_ADSENSE_CLIENT",
  "NEXT_PUBLIC_ENABLE_ADS",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_ADSENSE_SLOT_HOME_INLINE",
  "NEXT_PUBLIC_ADSENSE_SLOT_POST_FOOTER",
];

const missingRequired = requiredEnv.filter((key) => {
  const value = process.env[key];
  return value == null || value.trim() === "";
});

if (missingRequired.length > 0) {
  console.error("[launch:check] Missing required env:");
  for (const key of missingRequired) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

const authUrl = process.env.AUTH_URL ?? "";
if (
  authUrl.startsWith("http://") ||
  authUrl.includes("127.0.0.1") ||
  authUrl.includes("localhost")
) {
  console.warn(
    `[launch:check] Warning: AUTH_URL looks local or non-https: ${authUrl}`,
  );
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
if (
  siteUrl.startsWith("http://") ||
  siteUrl.includes("127.0.0.1") ||
  siteUrl.includes("localhost")
) {
  console.warn(
    `[launch:check] Warning: NEXT_PUBLIC_SITE_URL looks local or non-https: ${siteUrl}`,
  );
}

for (const key of optionalEnv) {
  const value = process.env[key];
  if (value == null || value.trim() === "") {
    console.warn(`[launch:check] Optional env is not set: ${key}`);
  }
}

console.log("[launch:check] Required env check passed.");
