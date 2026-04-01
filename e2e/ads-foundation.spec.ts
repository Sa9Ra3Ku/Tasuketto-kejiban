import { expect, test } from "@playwright/test";

import { disconnectFixtureDb, getPostFixture } from "./helpers/post-fixtures";

const adsEnvEnabled =
  (process.env.NEXT_PUBLIC_ENABLE_ADS ?? "").toLowerCase() === "true" &&
  Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);

let postId: number;

test.beforeAll(async () => {
  const post = await getPostFixture();
  postId = post.id;
});

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("A. env 未設定時は広告枠が出ず、ページが壊れない", async ({ page }) => {
  test.skip(adsEnvEnabled, "広告有効ENVではこの観点をスキップします。");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "いまのモヤモヤを、みんなで深堀りする場所" })).toBeVisible();
  await expect(page.getByTestId("home-inline-ad-slot")).toHaveCount(0);

  await page.goto(`/posts/${postId}`);
  await expect(page.getByRole("heading", { name: "投稿の深堀り" })).toBeVisible();
  await expect(page.getByTestId("post-inline-ad-slot")).toHaveCount(0);
});

test("B. env 有効時は広告スロット枠が表示される", async ({ page }) => {
  test.skip(!adsEnvEnabled, "広告有効ENVがないためスキップします。");

  await page.goto("/");
  await expect(page.getByTestId("home-inline-ad-slot")).toBeVisible();

  await page.goto(`/posts/${postId}`);
  await expect(page.getByTestId("post-inline-ad-slot")).toBeVisible();
});

test("C. 広告説明ページが開ける", async ({ page }) => {
  await page.goto("/ads-info");
  await expect(page.getByTestId("ads-info-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "広告と運営方針" })).toBeVisible();
});
