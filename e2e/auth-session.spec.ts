import { expect, test } from "@playwright/test";

import { signInAsAyano } from "./helpers/auth-playwright";
import {
  disconnectFixtureDb,
  ensureFocusRootDeepDive,
  getPostFixture,
} from "./helpers/post-fixtures";

let postId: number;

test.beforeAll(async () => {
  const post = await getPostFixture();
  postId = post.id;
  await ensureFocusRootDeepDive(post.id);
});

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("A. 未ログインで /posts/new はログイン導線", async ({ page }) => {
  await page.goto("/posts/new");
  await expect(page.getByTestId("new-post-login-prompt")).toBeVisible();
  await expect(page.getByTestId("new-post-signin-link")).toBeVisible();
});

test("B. 未ログインで深堀りフォーム位置にログイン導線", async ({ page }) => {
  await page.goto(`/posts/${postId}`);
  await expect(page.getByTestId("deepdive-login-prompt")).toBeVisible();
  await expect(page.getByTestId("deepdive-signin-link")).toBeVisible();
  await expect(page.getByTestId("deepdive-form")).toHaveCount(0);
});

test("C. デモログインできる", async ({ page }) => {
  await page.goto("/signin");
  await page.getByTestId("signin-email").fill("ayano@demo.local");
  await page.getByTestId("signin-password").fill("demo123");
  await page.getByTestId("signin-submit").click();
  await expect(page).not.toHaveURL(/\/signin/);
  await expect(page.getByTestId("header-user-name")).toContainText("彩乃");
});

test("D. ログイン後に深堀り追加できる", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto(`/posts/${postId}`);
  await expect(page.getByTestId("deepdive-form")).toBeVisible();
  await page.selectOption("#type", "SUMMARY");
  await page.getByLabel("本文").fill(`E2E auth deepdive ${Date.now()}`);
  await page.getByTestId("compose-submit").click();
  await expect(page).toHaveURL(/composeDiveType=SUMMARY/);
});

test("E. 仮ユーザー選択UIがない", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto(`/posts/${postId}`);
  await expect(page.getByLabel("投稿者")).toHaveCount(0);
  await expect(page.locator("#userId")).toHaveCount(0);

  await page.goto("/posts/new");
  await expect(page.getByTestId("new-post-submit")).toBeVisible();
  await expect(page.getByLabel("投稿者")).toHaveCount(0);
});
