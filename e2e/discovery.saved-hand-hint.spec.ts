import { expect, test } from "@playwright/test";

import { signInAsAyano } from "./helpers/auth-playwright";
import {
  disconnectFixtureDb,
  getAyanoSavedActivityPostId,
  getAyanoSavedWithoutNewActivityPostId,
  getPostIdWhoseRelatedIncludes,
} from "./helpers/post-fixtures";

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("discovery hand hint. 未ログインでは手元ラベルが出ない", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("post-card-hand-discovery")).toHaveCount(0);
});

test("discovery hand hint. ログイン中は手元に置いた流れに薄い表示がある", async ({ page }) => {
  const savedOnlyId = await getAyanoSavedWithoutNewActivityPostId();
  await signInAsAyano(page);
  await page.goto("/");
  const main = page.getByTestId("home-main-post-list");
  const card = main.getByTestId(`post-card-link-${savedOnlyId}`);
  await expect(card.getByTestId("post-card-hand-discovery")).toHaveText("手元に置いています");
  await expect(card.locator('[data-hand-kind="on_hand"]')).toHaveCount(1);
});

test("discovery hand hint. 新しい動きがある手元はその表示が優先される", async ({ page }) => {
  const activeId = await getAyanoSavedActivityPostId();
  await signInAsAyano(page);
  await page.goto("/");
  const main = page.getByTestId("home-main-post-list");
  const card = main.getByTestId(`post-card-link-${activeId}`);
  await expect(card.getByTestId("post-card-hand-discovery")).toHaveText("手元で新しく動いています");
  await expect(card.locator('[data-hand-kind="new_activity"]')).toHaveCount(1);
});

test("discovery hand hint. 今動いている流れでも手元状態が出る", async ({ page }) => {
  const activeId = await getAyanoSavedActivityPostId();
  await signInAsAyano(page);
  await page.goto("/");
  const section = page.getByTestId("home-active-flows-section");
  const item = section.locator(`[data-testid="post-card-link-${activeId}"]`);
  await expect(item.getByTestId("post-card-hand-discovery")).toHaveText("手元で新しく動いています");
});

test("discovery hand hint. 近い流れでも手元状態が出る", async ({ page }) => {
  const savedOnlyId = await getAyanoSavedWithoutNewActivityPostId();
  const anchorPostId = await getPostIdWhoseRelatedIncludes(savedOnlyId);
  await signInAsAyano(page);
  await page.goto(`/posts/${anchorPostId}`);
  const related = page.getByTestId("related-flows-section");
  const item = related.locator(`[data-testid="post-card-link-${savedOnlyId}"]`);
  await expect(item.getByTestId("post-card-hand-discovery")).toHaveText("手元に置いています");
});
