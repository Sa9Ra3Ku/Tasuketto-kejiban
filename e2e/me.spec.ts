import { expect, test } from "@playwright/test";

import { signInAsAyano, signInAsEmptyIncoming } from "./helpers/auth-playwright";
import { disconnectFixtureDb } from "./helpers/post-fixtures";

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("A. 未ログインで /me に行くとサインインへつながる", async ({ page }) => {
  await page.goto("/me");
  await expect(page).toHaveURL(/\/signin/);
  await expect(page.url()).toMatch(/callbackUrl=/);
});

test("B. ログイン後、ヘッダーに /me 導線がある", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/");
  await expect(page.getByTestId("header-realtime-listener")).toBeAttached();
  const meLink = page.getByTestId("header-me-link");
  await expect(meLink).toBeVisible();
  await expect(meLink).toHaveAttribute("href", "/me");
});

test("C. /me に自分へ返ってきた重なりセクションがある", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  await expect(page.getByTestId("me-realtime-listener")).toBeAttached();
  await expect(page.getByTestId("me-incoming-overlaps-section")).toBeVisible();
  await expect(page.getByRole("heading", { name: "自分へ返ってきた重なり" })).toBeVisible();
});

test("C2. /me 最上部に「いま返しやすい流れ」がある", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  await expect(page.getByTestId("me-easy-reply-section")).toBeVisible();
  await expect(page.getByRole("heading", { name: "いま返しやすい流れ" })).toBeVisible();
});

test("C3. いま返しやすい流れから角度を見ると #deepdive- に届く", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  const link = page.locator('[data-testid^="me-easy-reply-view-"]').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/posts\/\d+\?.*workbenchSource=me.*workbenchFlow=easyReply.*returnTo=me.*#deepdive-\d+$/);
  await link.click();
  await expect(page).toHaveURL(/\/posts\/\d+/);
  await expect(page).toHaveURL(/workbenchSource=me/);
  await expect(page).toHaveURL(/workbenchFlow=easyReply/);
  await expect(page).toHaveURL(/returnTo=me/);
  await expect(page).toHaveURL(/#deepdive-\d+/);
  const url = new URL(page.url());
  await expect(page.locator(url.hash)).toBeVisible();
});

test("C4. いま返しやすい流れからさらに重ねると compose が深堀り向きになる", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  const stack = page.locator('[data-testid^="me-easy-reply-stack-"]').first();
  await expect(stack).toBeVisible();
  const href = await stack.getAttribute("href");
  expect(href).toMatch(/composeTarget=deepDive/);
  expect(href).toMatch(/composeParentDeepDiveId=\d+/);
  expect(href).toMatch(/composeSource=(incoming|savedActivity)/);
  expect(href).toMatch(/workbenchSource=me/);
  expect(href).toMatch(/workbenchFlow=easyReply/);
  expect(href).toMatch(/returnTo=me/);
  expect(href).toMatch(/#deepdive-\d+/);
  await stack.click();
  await expect(page).toHaveURL(/composeTarget=deepDive/);
  await expect(page).toHaveURL(/workbenchSource=me/);
  await expect(page).toHaveURL(/workbenchFlow=easyReply/);
  await expect(page).toHaveURL(/returnTo=me/);
  await expect(page.getByTestId("back-to-workbench")).toBeVisible();
  const deepDiveMode = page.getByTestId("target-mode-deepdive");
  await expect(deepDiveMode).toHaveAttribute("data-active", "true");
  const composeHint = page.getByTestId("compose-incoming-hint").or(page.getByTestId("compose-saved-activity-hint"));
  await expect(composeHint).toBeVisible();
});

test("C4-2. いま返しやすい流れ起点で投稿すると /me 作業面へ戻る", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  await page.locator('[data-testid^="me-easy-reply-stack-"]').first().click();
  await expect(page.getByTestId("back-to-workbench")).toBeVisible();

  await page.locator("#type").selectOption("EMPATHY");
  await page.locator("#body").fill(`E2E workbench return ${Date.now()}`);
  await page.getByTestId("compose-submit").click();

  await expect(page).toHaveURL(/\/me\?fromPostedWorkbench=1&postedFrom=easyReply#me-easy-reply$/);
  await expect(page.getByTestId("me-workbench-posted-notice")).toBeVisible();
});

test("C4-3. 角度を見る経由では投稿後に /me へは戻らない", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  await page.locator('[data-testid^="me-easy-reply-view-"]').first().click();
  await expect(page.getByTestId("back-to-workbench")).toBeVisible();

  await page.locator('[data-testid^="stack-to-deepdive-"]').first().click();
  await page.locator("#type").selectOption("EMPATHY");
  await page.locator("#body").fill(`E2E from view keeps detail ${Date.now()}`);
  await page.getByTestId("compose-submit").click();

  await expect(page).toHaveURL(/\/posts\/\d+/);
  await expect(page).not.toHaveURL(/\/me\?/);
});

test("C5. 返りも手元の動きも少ないユーザーでもいま返しやすい流れが崩れない", async ({ page }) => {
  await signInAsEmptyIncoming(page);
  await page.goto("/me");
  await expect(page.getByTestId("me-easy-reply-section")).toBeVisible();
  await expect(page.getByTestId("me-easy-reply-empty")).toBeVisible();
  await expect(page.getByTestId("me-saved-activity-section")).toBeVisible();
});

test("D. /me に自分が立てた流れセクションがある", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  await expect(page.getByTestId("me-my-flows-section")).toBeVisible();
  await expect(page.getByRole("heading", { name: "自分が立てた流れ" })).toBeVisible();
});

test("E. /me に自分が重ねた角度セクションがある", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  await expect(page.getByTestId("me-my-deepdives-section")).toBeVisible();
  await expect(page.getByRole("heading", { name: "自分が重ねた角度" })).toBeVisible();
});

test("F. 自分が重ねた角度から詳細へ飛ぶと該当角度の位置が取れる", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  const link = page.locator('[data-testid^="me-deepdive-link-"]').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/posts\/\d+#deepdive-\d+$/);
  await link.click();
  await expect(page).toHaveURL(/\/posts\/\d+/);
  await expect(page).toHaveURL(/#deepdive-\d+/);
  const url = new URL(page.url());
  const hash = url.hash;
  expect(hash).toMatch(/^#deepdive-\d+$/);
  await expect(page.locator(hash)).toBeVisible();
});

test("G. 返ってきた重なりから詳細へ飛ぶと該当深堀りのアンカーへ届く", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  const link = page.locator('[data-testid^="me-incoming-overlap-view-"]').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/posts\/\d+#deepdive-\d+$/);
  await link.click();
  await expect(page).toHaveURL(/\/posts\/\d+/);
  await expect(page).toHaveURL(/#deepdive-\d+/);
  const url = new URL(page.url());
  const hash = url.hash;
  expect(hash).toMatch(/^#deepdive-\d+$/);
  await expect(page.locator(hash)).toBeVisible();
});

test("H. 返ってきた重なりがない場合も空状態で崩れない", async ({ page }) => {
  await signInAsEmptyIncoming(page);
  await page.goto("/me");
  await expect(page.getByTestId("me-incoming-overlaps-section")).toBeVisible();
  await expect(page.getByTestId("me-incoming-overlaps-empty")).toBeVisible();
  await expect(page.getByTestId("me-my-flows-section")).toBeVisible();
});

test("I. 未確認の返りがあるユーザーではヘッダーに件数バッジが出る", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/");
  await expect(page.getByTestId("header-incoming-new-badge")).toBeVisible();
});

test("J. /me で新しく返ってきた重なりが分かる", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  await expect(page.getByTestId("me-new-incoming-summary")).toBeVisible();
  const anyNew = page.locator('[data-testid^="me-incoming-item-new-"]');
  await expect(anyNew.first()).toBeVisible();
});

test("K. 「ここまで見たことにする」で新しさ表示とヘッダーバッジが消える", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  await expect(page.getByTestId("me-mark-incoming-seen")).toBeVisible();
  await page.getByTestId("me-mark-incoming-seen").click();
  await expect(page).toHaveURL(/\/me$/);
  await expect(page.locator('[data-testid^="me-incoming-item-new-"]')).toHaveCount(0);
  await page.goto("/");
  await expect(page.getByTestId("header-incoming-new-badge")).toHaveCount(0);
});

test("L. 返りがないユーザーではヘッダーバッジがなく空状態で崩れない", async ({ page }) => {
  await signInAsEmptyIncoming(page);
  await page.goto("/");
  await expect(page.getByTestId("header-incoming-new-badge")).toHaveCount(0);
  await page.goto("/me");
  await expect(page.getByTestId("me-incoming-overlaps-empty")).toBeVisible();
  await expect(page.getByTestId("me-new-incoming-summary")).toHaveCount(0);
});

test("M. 返りから「この角度にさらに重ねる」で compose 状態になり深堀りできる", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/me");
  const stack = page.locator('[data-testid^="me-incoming-overlap-stack-"]').first();
  await expect(stack).toBeVisible();
  const href = await stack.getAttribute("href");
  expect(href).toMatch(/composeTarget=deepDive/);
  expect(href).toMatch(/composeParentDeepDiveId=\d+/);
  expect(href).toMatch(/composeSource=incoming/);
  expect(href).toMatch(/#deepdive-\d+/);

  await stack.click();
  await expect(page).toHaveURL(/\/posts\/\d+/);
  await expect(page).toHaveURL(/composeTarget=deepDive/);
  await expect(page).toHaveURL(/composeParentDeepDiveId=\d+/);
  await expect(page).toHaveURL(/composeSource=incoming/);
  await expect(page).toHaveURL(/#deepdive-\d+/);

  await expect(page.getByTestId("compose-incoming-hint")).toBeVisible();
  const deepDiveMode = page.getByTestId("target-mode-deepdive");
  await expect(deepDiveMode).toHaveAttribute("data-active", "true");
  await expect(page.getByTestId("selected-parent-preview")).toBeVisible();

  await page.locator("#type").selectOption("EMPATHY");
  await page.locator("#body").fill("シードE2E: 返ってきた角度へそのまま重ねた一文です。");
  await page.getByTestId("compose-submit").click();

  await expect(page).toHaveURL(/\/posts\/\d+/);
  await expect(page).not.toHaveURL(/composeSource=incoming/);
  await expect(page.getByTestId("compose-incoming-hint")).toHaveCount(0);
});
