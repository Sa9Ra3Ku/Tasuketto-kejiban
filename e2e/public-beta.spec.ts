import { expect, test } from "@playwright/test";

import { disconnectFixtureDb, getPostFixture } from "./helpers/post-fixtures";

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("A/B. /signup から登録してログイン状態に入れる", async ({ page }) => {
  const email = `beta-${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.getByTestId("signup-name").fill("公開ベータ太郎");
  await page.getByTestId("signup-email").fill(email);
  await page.getByTestId("signup-password").fill("beta-pass-1234");
  await page.getByTestId("signup-submit").click();

  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("header-user-name")).toContainText("公開ベータ太郎");
  await expect(page.getByTestId("header-me-link")).toBeVisible();
});

test("C. 未ログイン時ヘッダーに「入る」「はじめる」が見える", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("header-sign-in")).toBeVisible();
  await expect(page.getByTestId("header-sign-up")).toBeVisible();
});

test("D. 主要固定ページを開ける", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "助けっ人掲示板とは" })).toBeVisible();

  await page.goto("/guidelines");
  await expect(page.getByRole("heading", { name: "使い方と流れ" })).toBeVisible();

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "プライバシー" })).toBeVisible();

  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "利用規約" })).toBeVisible();
});

test("E. core 体験（/me と詳細 compose 導線）が崩れていない", async ({ page }) => {
  const post = await getPostFixture();

  await page.goto("/me");
  await expect(page).toHaveURL(/\/signin/);

  await page.goto(`/posts/${post.id}`);
  await expect(page.getByTestId("deepdive-login-prompt")).toBeVisible();
});
