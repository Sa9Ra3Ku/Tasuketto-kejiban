import { expect, test } from "@playwright/test";

import {
  disconnectFixtureDb,
  ensureFocusRootDeepDive,
  getPostFixture,
} from "./helpers/post-fixtures";

let postId: number;
let focusRootId: number;
let focusRootType: string;

test.beforeAll(async () => {
  const post = await getPostFixture();
  postId = post.id;
  const focusRoot = await ensureFocusRootDeepDive(post.id);
  focusRootId = focusRoot.id;
  focusRootType = focusRoot.type;
});

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("E. type フィルタと focus の両立", async ({ page }) => {
  await page.goto(`/posts/${postId}?focusFromDeepDiveId=${focusRootId}&type=${focusRootType}`);

  await expect(page.getByTestId("focus-flow-banner")).toBeVisible();
  await expect(page.getByTestId(`type-filter-${focusRootType}`)).toHaveAttribute("data-active", "true");

  const visibleItems = page.locator('[data-testid^="deepdive-item-"]');
  const visibleCount = await visibleItems.count();
  expect(visibleCount).toBeGreaterThan(0);
  for (let i = 0; i < visibleCount; i++) {
    await expect(visibleItems.nth(i)).toHaveAttribute("data-deepdive-type", focusRootType);
  }

  await page.getByTestId("type-filter-ALL").click();
  await expect(page.getByTestId("focus-flow-banner")).toBeVisible();
  await expect(page).toHaveURL(/focusFromDeepDiveId=/);
});
