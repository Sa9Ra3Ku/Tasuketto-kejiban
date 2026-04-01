import { expect, test } from "@playwright/test";

import { disconnectFixtureDb, getPostFixture } from "./helpers/post-fixtures";

let postId: number;

test.beforeAll(async () => {
  const post = await getPostFixture();
  postId = post.id;
});

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("A-B. 未ログインの shared landing で onboarding と signup 導線が見える", async ({ page }) => {
  await page.goto(`/posts/${postId}`);
  await expect(page.getByTestId("shared-landing-onboarding")).toBeVisible();
  await expect(page.getByTestId("shared-landing-signup-cta")).toBeVisible();

  await page.getByTestId("shared-landing-signup-cta").click();
  await expect(page).toHaveURL(
    new RegExp(
      `/signup\\?callbackUrl=%2Fposts%2F${postId}%3FfromLandingAuth%3D1%26returnedFromAuth%3DsharedPost`,
    ),
  );
});

test("C-D-E. signup 復帰直後に first contribution 導線が出て投稿後に query が消える", async ({ page }) => {
  await page.goto(`/posts/${postId}`);
  await page.getByTestId("shared-landing-signup-cta").click();
  await expect(page).toHaveURL(
    new RegExp(
      `/signup\\?callbackUrl=%2Fposts%2F${postId}%3FfromLandingAuth%3D1%26returnedFromAuth%3DsharedPost`,
    ),
  );

  const email = `first-contribution-${Date.now()}@e2e.local`;
  await page.getByTestId("signup-name").fill("復帰テスター");
  await page.getByTestId("signup-email").fill(email);
  await page.getByTestId("signup-password").fill("demo12345");
  await page.getByTestId("signup-submit").click();

  await expect(page).toHaveURL(
    new RegExp(`/posts/${postId}\\?fromLandingAuth=1&returnedFromAuth=sharedPost`),
  );
  await expect(page.getByTestId("landing-auth-first-contribution")).toBeVisible();
  await expect(page.getByTestId("landing-auth-first-contribution-cta")).toBeVisible();
  await expect(page.getByTestId("landing-auth-writing-assist")).toBeVisible();

  await page.getByTestId("landing-auth-first-contribution-cta").click();
  await expect(page.locator("#deepdive-form-section")).toBeInViewport();

  await page.selectOption("#type", "PERSPECTIVE");
  await page.locator("#body").fill("まずは短く、ここが引っかかりました。");
  await page.getByTestId("compose-submit").click();

  await page.waitForURL(new RegExp(`/posts/${postId}`));
  await expect.poll(() => page.url()).not.toContain("fromLandingAuth=1");
  await expect.poll(() => page.url()).not.toContain("returnedFromAuth=sharedPost");
});

test("F. signin 後に元の投稿詳細へ戻れる", async ({ page }) => {
  await page.goto(`/posts/${postId}`);
  await page.getByTestId("shared-landing-signin-cta").click();
  await expect(page).toHaveURL(
    new RegExp(
      `/signin\\?callbackUrl=%2Fposts%2F${postId}%3FfromLandingAuth%3D1%26returnedFromAuth%3DsharedPost`,
    ),
  );

  await page.getByTestId("signin-email").fill("ayano@demo.local");
  await page.getByTestId("signin-password").fill("demo123");
  await page.getByTestId("signin-submit").click();

  await expect(page).toHaveURL(
    new RegExp(`/posts/${postId}\\?fromLandingAuth=1&returnedFromAuth=sharedPost`),
  );
  await expect(page.getByTestId("deepdive-form")).toBeVisible();
});

test("G. 既存の deepdive ログイン導線はそのまま機能する", async ({ page }) => {
  await page.goto(`/posts/${postId}`);
  await expect(page.getByTestId("deepdive-login-prompt")).toBeVisible();
  await page.getByTestId("deepdive-signin-link").click();
  await expect(page).toHaveURL(
    new RegExp(
      `/signin\\?callbackUrl=%2Fposts%2F${postId}%3FfromLandingAuth%3D1%26returnedFromAuth%3DsharedPost`,
    ),
  );
});
