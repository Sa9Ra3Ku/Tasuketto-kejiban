import { expect, test } from "@playwright/test";

import { disconnectFixtureDb, getPostFixture } from "./helpers/post-fixtures";

let postId: number;
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
    throw new Error("E2E fixture post requires at least one tag for related flows test.");
  }
});

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("近い流れセクションが表示され、別投稿へ辿れ、一覧へ戻るが維持される", async ({ page }) => {
  await page.goto(
    `/?q=${encodeURIComponent(discoveryQ)}&postType=${discoveryPostType}&tag=${encodeURIComponent(discoveryTag)}&sort=deep`,
  );
  await page.getByTestId(`post-card-link-${postId}`).click();
  await expect(page).toHaveURL(new RegExp(`/posts/${postId}`));

  const relatedSection = page.getByTestId("related-flows-section");
  await expect(relatedSection).toBeVisible();

  const firstRelatedItem = page.locator('[data-testid^="related-flow-item-"]').first();
  await expect(firstRelatedItem).toBeVisible();

  const relatedLinkWrapper = page.locator('[data-testid^="related-flow-link-"]').first();
  const relatedHref = await relatedLinkWrapper.locator(`a[data-testid^="post-card-link-"]`).getAttribute("href");
  expect(relatedHref).toBeTruthy();
  const relatedIdMatch = relatedHref?.match(/\/posts\/(\d+)/);
  expect(relatedIdMatch).toBeTruthy();
  const relatedPostId = Number(relatedIdMatch![1]);
  expect(relatedPostId).not.toBe(postId);

  await relatedLinkWrapper.locator(`a[data-testid^="post-card-link-"]`).click();
  await expect(page).toHaveURL(new RegExp(`/posts/${relatedPostId}`));
  await expect(page).toHaveURL(new RegExp(`fromTag=${encodeURIComponent(discoveryTag)}`));

  await page.getByTestId("back-to-discovery").click();
  await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(discoveryQ)}`));
  await expect(page).toHaveURL(new RegExp(`postType=${discoveryPostType}`));
  await expect(page).toHaveURL(new RegExp(`tag=${encodeURIComponent(discoveryTag)}`));
  await expect(page).toHaveURL(/sort=deep/);
});
