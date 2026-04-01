import { expect, test } from "@playwright/test";

import { signInAsAyano, signInAsEmptyIncoming } from "./helpers/auth-playwright";

test("A. 未ログインでは「今の自分に近い流れ」セクションが出ない", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("home-personalized-near-flows-section")).toHaveCount(0);
});

test("B. ログイン中・材料があるユーザーではセクションが表示される", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/");

  const section = page.getByTestId("home-personalized-near-flows-section");
  await expect(section).toBeVisible();
  await expect(section.getByRole("heading", { name: "今の自分に近い流れ" })).toBeVisible();
});

test("C. 項目がある場合、リンクで /posts/[id] に遷移できる", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/");

  const section = page.getByTestId("home-personalized-near-flows-section");
  const link = section.locator('[data-testid^="post-card-link-"]').first();
  await expect(link).toBeVisible();
  await link.click();

  await expect(page).toHaveURL(/\/posts\/\d+/);
  await expect(page.getByRole("heading", { name: "投稿の深堀り" })).toBeVisible();
});

test("D. 材料が少ないユーザーでも空状態で崩れない", async ({ page }) => {
  await signInAsEmptyIncoming(page);
  await page.goto("/");

  const section = page.getByTestId("home-personalized-near-flows-section");
  await expect(section).toBeVisible();
  await expect(page.getByTestId("home-personalized-near-flows-empty")).toBeVisible();
  await expect(section.locator('[data-testid^="post-card-link-"]')).toHaveCount(0);
});

test("E. q 検索中はパーソナルセクションが非表示", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/?q=%E8%BB%A2%E8%81%B7");

  await expect(page.getByTestId("home-personalized-near-flows-section")).toHaveCount(0);
});

test("F. 既存のホーム補助セクションはログイン後も残る", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/");

  await expect(page.getByTestId("home-active-flows-section")).toBeVisible();
  await expect(page.getByTestId("home-shallow-flows-section")).toBeVisible();
});
