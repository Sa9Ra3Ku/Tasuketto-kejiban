import { expect, test } from "@playwright/test";

import { disconnectFixtureDb, getPostFixture } from "./helpers/post-fixtures";

let postId: number;
let postTitle: string;
let postTypeLabel: string;

const postTypeLabels: Record<string, string> = {
  WORRY: "悩み",
  ISSUE: "課題",
  DEDUCTION: "推理",
  HYPOTHESIS: "仮説",
  PREDICTION: "予想",
};

test.beforeAll(async () => {
  const post = await getPostFixture();
  postId = post.id;
  postTitle = post.title;
  postTypeLabel = postTypeLabels[post.type];
});

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("投稿詳細に共有導線が表示され、URLコピー後に軽い成功フィードバックが出る", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => undefined,
      },
    });
  });

  await page.goto(`/posts/${postId}`);

  await expect(page.getByTestId("post-share-panel")).toBeVisible();
  await expect(page.getByTestId("post-share-copy-button")).toBeVisible();

  await page.getByTestId("post-share-copy-button").click();
  await expect(page.getByTestId("post-share-feedback")).toContainText("この流れのURLを控えました");
});

test("投稿ごとにmetadata/OGPのタイトルと説明文が切り替わる", async ({ page }) => {
  await page.goto(`/posts/${postId}`);

  await expect(page).toHaveTitle(new RegExp(postTitle));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", new RegExp(postTitle));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    new RegExp(postTypeLabel),
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    new RegExp(postTitle),
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    new RegExp(postTypeLabel),
  );
});
