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

test("C. 「この深堀りに重ねる」導線", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto(`/posts/${postId}`);
  await expect(page.getByTestId("post-realtime-listener")).toBeAttached();

  const firstStackLink = page.locator('[data-testid^="stack-to-deepdive-"]').first();
  const stackTestId = await firstStackLink.getAttribute("data-testid");
  if (!stackTestId) throw new Error("stack link test id is missing");
  const parentId = stackTestId.replace("stack-to-deepdive-", "");

  await firstStackLink.click();
  await expect(page).toHaveURL(new RegExp(`composeParentDeepDiveId=${parentId}`));
  await expect(page.getByTestId("target-mode-deepdive")).toHaveAttribute("data-active", "true");
  await expect(page.getByTestId("selected-parent-preview")).toBeVisible();
  await expect(page.getByTestId("selected-parent-preview")).toContainText("さん /");
});

test("D-1. 投稿成功後(focusなし)の戻り方", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto(`/posts/${postId}`);

  const firstStackLink = page.locator('[data-testid^="stack-to-deepdive-"]').first();
  await firstStackLink.click();
  await expect(page.getByTestId("target-mode-deepdive")).toHaveAttribute("data-active", "true");

  await page.selectOption("#type", "EMPATHY");
  await page.getByLabel("本文").fill(`E2E post without focus ${Date.now()}`);
  await page.getByTestId("compose-submit").click();

  await expect(page.getByLabel("本文")).toHaveValue("");
  await expect(page.getByTestId("target-mode-post")).toHaveAttribute("data-active", "true");
  await expect(page).not.toHaveURL(/composeParentDeepDiveId=/);
  await expect(page).toHaveURL(/composeDiveType=EMPATHY/);
  await expect(page).not.toHaveURL(/focusFromDeepDiveId=/);
});

test("D-2. 投稿成功後(focusあり)の戻り方", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto(`/posts/${postId}?focusFromDeepDiveId=${focusRootId}&type=EMPATHY`);

  const firstStackLink = page.locator('[data-testid^="stack-to-deepdive-"]').first();
  await firstStackLink.click();
  await expect(page.getByTestId("target-mode-deepdive")).toHaveAttribute("data-active", "true");

  await page.selectOption("#type", "PERSPECTIVE");
  await page.getByLabel("本文").fill(`E2E post with focus ${Date.now()}`);
  await page.getByTestId("compose-submit").click();

  await expect(page.getByLabel("本文")).toHaveValue("");
  await expect(page.getByTestId("target-mode-focus-root")).toHaveAttribute("data-active", "true");
  await expect(page).not.toHaveURL(/composeParentDeepDiveId=/);
  await expect(page).toHaveURL(/focusFromDeepDiveId=/);
  await expect(page).toHaveURL(/type=EMPATHY/);
  await expect(page).toHaveURL(/composeDiveType=PERSPECTIVE/);
});
