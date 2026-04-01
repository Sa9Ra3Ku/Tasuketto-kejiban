import { expect, test } from "@playwright/test";

import { signInAsAyano } from "./helpers/auth-playwright";
import {
  disconnectFixtureDb,
  ensureFocusRootDeepDive,
  getPostFixture,
} from "./helpers/post-fixtures";

let postId: number;
let focusRootId: number;

test.beforeAll(async () => {
  const post = await getPostFixture();
  postId = post.id;
  const focusRoot = await ensureFocusRootDeepDive(post.id);
  focusRootId = focusRoot.id;
});

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("A. 通常表示の初期状態", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto(`/posts/${postId}`);

  await expect(page.getByTestId("deepdive-list")).toBeVisible();
  await expect(page.locator('[data-testid^="deepdive-item-"]').first()).toBeVisible();
  await expect(page.getByTestId("target-mode-post")).toHaveAttribute("data-active", "true");
});

test("B. focus モードの初期状態", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto(`/posts/${postId}?focusFromDeepDiveId=${focusRootId}`);

  await expect(page.getByTestId("focus-flow-banner")).toBeVisible();
  await expect(page.getByTestId("target-mode-focus-root")).toHaveAttribute("data-active", "true");
});

test("F. 不正クエリ時の安全な fallback", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto(
    `/posts/${postId}?focusFromDeepDiveId=99999999&composeParentDeepDiveId=99999999&composeTarget=deepDive`,
  );

  await expect(page.getByTestId("deepdive-list")).toBeVisible();
  await expect(page.getByTestId("target-mode-post")).toHaveAttribute("data-active", "true");
  await expect(page.getByText("PrismaClient", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Error:", { exact: false })).toHaveCount(0);
});
