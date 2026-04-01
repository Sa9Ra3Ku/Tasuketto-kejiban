import { expect, test } from "@playwright/test";

import { disconnectFixtureDb, ensureFocusRootDeepDive, getPostFixture } from "./helpers/post-fixtures";

let postId: number;
let focusRootId: number;
let discoveryQ: string;
let discoveryPostType: string;
let discoveryTag: string;

test.beforeAll(async () => {
  const post = await getPostFixture();
  postId = post.id;
  discoveryQ = post.title.slice(0, 2);
  discoveryPostType = post.type;
  discoveryTag = post.postTags[0]?.tag.name ?? "";
  if (!discoveryTag) {
    throw new Error("E2E fixture post requires at least one tag for discovery context test.");
  }
  const focusRoot = await ensureFocusRootDeepDive(post.id);
  focusRootId = focusRoot.id;
});

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("一覧の discovery 文脈を詳細へ持ち込み、同じ条件へ戻れる", async ({ page }) => {
  await page.goto(
    `/?q=${encodeURIComponent(discoveryQ)}&postType=${discoveryPostType}&tag=${encodeURIComponent(discoveryTag)}&sort=deep`,
  );

  await page.getByTestId(`post-card-link-${postId}`).click();

  await expect(page).toHaveURL(new RegExp(`fromQ=${encodeURIComponent(discoveryQ)}`));
  await expect(page).toHaveURL(new RegExp(`fromPostType=${discoveryPostType}`));
  await expect(page).toHaveURL(new RegExp(`fromTag=${encodeURIComponent(discoveryTag)}`));
  await expect(page).toHaveURL(/fromSort=deep/);
  await expect(page.getByTestId("back-to-discovery")).toBeVisible();
  await expect(page.getByTestId("discovery-context-note")).toBeVisible();

  await page.getByTestId("type-filter-EMPATHY").click();
  await expect(page).toHaveURL(/type=EMPATHY/);
  await expect(page).toHaveURL(new RegExp(`fromQ=${encodeURIComponent(discoveryQ)}`));

  const firstStackLink = page.locator('[data-testid^="stack-to-deepdive-"]').first();
  await firstStackLink.click();
  await expect(page).toHaveURL(/composeParentDeepDiveId=/);
  await expect(page).toHaveURL(new RegExp(`fromPostType=${discoveryPostType}`));

  await page.goto(
    `/posts/${postId}?fromQ=${encodeURIComponent(discoveryQ)}&fromPostType=${discoveryPostType}&fromTag=${encodeURIComponent(discoveryTag)}&fromSort=deep&focusFromDeepDiveId=${focusRootId}&composeTarget=focusRoot`,
  );
  await expect(page.getByTestId("focus-flow-banner")).toBeVisible();
  await page.getByTestId("back-to-discovery").click();

  await expect(page).toHaveURL(/^\S*\/\?/);
  await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(discoveryQ)}`));
  await expect(page).toHaveURL(new RegExp(`postType=${discoveryPostType}`));
  await expect(page).toHaveURL(new RegExp(`tag=${encodeURIComponent(discoveryTag)}`));
  await expect(page).toHaveURL(/sort=deep/);
});
