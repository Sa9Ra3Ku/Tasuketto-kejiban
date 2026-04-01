import type { Page } from "@playwright/test";

/** シードのデモユーザー（彩乃）でサインインする */
export async function signInAsAyano(page: Page) {
  await page.goto("/signin");
  await page.getByTestId("signin-email").fill("ayano@demo.local");
  await page.getByTestId("signin-password").fill("demo123");
  await page.getByTestId("signin-submit").click();
  await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 15_000 });
}

/** 返ってきた重なりが空になるシードユーザーでサインインする */
export async function signInAsEmptyIncoming(page: Page) {
  await page.goto("/signin");
  await page.getByTestId("signin-email").fill("emptyincoming@demo.local");
  await page.getByTestId("signin-password").fill("demo123");
  await page.getByTestId("signin-submit").click();
  await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 15_000 });
}
