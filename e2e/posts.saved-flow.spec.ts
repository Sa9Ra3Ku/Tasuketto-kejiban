import { expect, test } from "@playwright/test";

import { signInAsAyano, signInAsEmptyIncoming } from "./helpers/auth-playwright";
import {
  disconnectFixtureDb,
  getAyanoSavedActivityLatestNewDeepDive,
  getAyanoSavedActivityPostId,
  getPostFixture,
} from "./helpers/post-fixtures";

let postId: number;
let postTitle: string;

test.beforeAll(async () => {
  const post = await getPostFixture();
  postId = post.id;
  postTitle = post.title;
});

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("A/B. ログイン中は /posts/[id] で手元に置く導線が使える", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto(`/posts/${postId}`);

  const saveToggle = page.getByTestId("post-save-toggle");
  await expect(saveToggle).toBeVisible();
  await expect(saveToggle).toHaveText(/手元に置く|手元から外す/);

  if ((await saveToggle.textContent())?.includes("手元から外す")) {
    await saveToggle.click();
    await expect(saveToggle).toHaveText("手元に置く");
  }

  await saveToggle.click();
  await expect(page.getByTestId("post-saved-badge")).toBeVisible();
  await expect(page.getByTestId("post-save-toggle")).toHaveText("手元から外す");
});

test("C/D/E. /me に手元に置いた流れが出て、外すと消える", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto(`/posts/${postId}`);

  const saveToggle = page.getByTestId("post-save-toggle");
  if ((await saveToggle.textContent())?.includes("手元に置く")) {
    await saveToggle.click();
    await expect(page.getByTestId("post-saved-badge")).toBeVisible();
  }

  await page.goto("/me");
  const savedSection = page.getByTestId("me-saved-flows-section");
  await expect(savedSection).toBeVisible();
  await expect(page.getByRole("heading", { name: "手元に置いた流れ" })).toBeVisible();
  await expect(savedSection.getByTestId(`post-card-link-${postId}`)).toBeVisible();
  await expect(savedSection).toContainText(postTitle);

  await page.goto(`/posts/${postId}`);
  await page.getByTestId("post-save-toggle").click();
  await expect(page.getByTestId("post-save-toggle")).toHaveText("手元に置く");

  await page.goto("/me");
  await expect(savedSection).toBeVisible();
  await expect(savedSection.getByTestId(`post-card-link-${postId}`)).toHaveCount(0);
});

test("saved activity. /me に手元で新しく動いた流れが出る", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");

  const activitySection = page.getByTestId("me-saved-activity-section");
  await expect(activitySection).toBeVisible();
  await expect(page.getByRole("heading", { name: "手元で新しく動いた流れ" })).toBeVisible();
  await expect(activitySection.getByTestId(/me-saved-activity-link-/).first()).toBeVisible();
});

test("saved activity. 最新角度の抜粋・着地・重ねる・補助表示・投稿まで", async ({ page }) => {
  const { postId: activePostId, deepDiveId, bodySnippet } = await getAyanoSavedActivityLatestNewDeepDive();
  await signInAsAyano(page);
  await page.goto("/me");

  const activitySection = page.getByTestId("me-saved-activity-section");
  await expect(
    activitySection.getByTestId(`me-saved-activity-latest-excerpt-${activePostId}`),
  ).toContainText(bodySnippet);

  await activitySection.getByTestId(`me-saved-activity-view-new-angle-${activePostId}`).click();
  await expect(page).toHaveURL(new RegExp(`/posts/${activePostId}#deepdive-${deepDiveId}$`));

  await page.goto("/me");
  await activitySection.getByTestId(`me-saved-activity-stack-new-angle-${activePostId}`).click();
  await expect(page).toHaveURL(new RegExp(`composeTarget=deepDive`));
  await expect(page).toHaveURL(new RegExp(`composeParentDeepDiveId=${deepDiveId}`));
  await expect(page).toHaveURL(new RegExp(`composeSource=savedActivity`));
  await expect(page).toHaveURL(new RegExp(`#deepdive-${deepDiveId}$`));

  await expect(page.getByTestId("target-mode-deepdive")).toHaveAttribute("data-active", "true");
  await expect(page.getByTestId("selected-parent-preview")).toBeVisible();
  await expect(page.getByTestId("compose-saved-activity-hint")).toBeVisible();

  await page.selectOption("#type", "EMPATHY");
  await page.getByLabel("本文").fill(`E2E saved activity stack ${Date.now()}`);
  await page.getByTestId("compose-submit").click();

  await expect(page.getByLabel("本文")).toHaveValue("");
});

test("saved activity. 詳細で新しい動きが見え、「ここまで見たことにする」で消える", async ({
  page,
}) => {
  const ayanoActiveSavedPostId = await getAyanoSavedActivityPostId();

  await signInAsAyano(page);
  await page.goto("/me");

  const activeLink = page.getByTestId(`me-saved-activity-link-${ayanoActiveSavedPostId}`);
  await expect(activeLink).toBeVisible();
  await activeLink.click();

  await expect(page.getByTestId("post-saved-activity-note")).toBeVisible();
  await expect(page.getByTestId("post-mark-saved-seen")).toBeVisible();
  await page.getByTestId("post-mark-saved-seen").click();
  await expect(page.getByTestId("post-saved-activity-note")).toHaveCount(0);
  await expect(page.getByTestId("post-mark-saved-seen")).toHaveCount(0);

  await page.goto("/me");
  await expect(page.getByTestId(`me-saved-activity-link-${ayanoActiveSavedPostId}`)).toHaveCount(0);
});

test("saved activity. 新しい動きがないユーザーでも空状態で崩れない", async ({ page }) => {
  await signInAsEmptyIncoming(page);
  await page.goto("/me");

  await expect(page.getByTestId("me-saved-activity-section")).toBeVisible();
  await expect(page.getByTestId("me-saved-activity-empty")).toBeVisible();
});

test("F. 未ログイン時は軽いサインイン導線に置き換わる", async ({ page }) => {
  await page.goto(`/posts/${postId}`);
  await expect(page.getByTestId("post-save-toggle")).toHaveCount(0);
  await expect(page.getByTestId("post-save-signin-link")).toBeVisible();
  await expect(page.getByTestId("post-save-signin-link")).toHaveAttribute("href", /\/signin\?/);
});
