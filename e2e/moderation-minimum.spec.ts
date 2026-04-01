import { expect, test } from "@playwright/test";

import { signInAsAyano } from "./helpers/auth-playwright";
import { createModerationFixture, disconnectFixtureDb } from "./helpers/post-fixtures";

let fixture: { postId: number; deepDiveId: number };

test.beforeAll(async () => {
  fixture = await createModerationFixture();
});

test.afterAll(async () => {
  await disconnectFixtureDb();
});

test("最小モデレーションの導線と管理操作", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto(`/posts/${fixture.postId}`);

  await expect(page.getByText("この流れを知らせる")).toBeVisible();
  await expect(page.getByText("この角度を知らせる")).toBeVisible();

  await page.getByText("この角度を知らせる").first().click();
  const openedForm = page.locator("details[open] form").first();
  await openedForm.locator('select[name="reasonKey"]').selectOption("SPAM");
  await openedForm.locator('textarea[name="note"]').fill(`E2E moderation note ${Date.now()}`);
  await openedForm.getByRole("button", { name: "運営へ伝える" }).click();
  await expect(page.getByText("運営へ伝えました。")).toBeVisible();

  await page.goto("/admin/reports");
  await expect(page.getByRole("heading", { name: "通報の確認" })).toBeVisible();
  await expect(page.getByText("DEEPDIVE").first()).toBeVisible();
  await page.getByRole("button", { name: "この角度を見えないようにする" }).first().click();

  await page.goto(`/posts/${fixture.postId}#deepdive-${fixture.deepDiveId}`);
  await expect(page.getByText("この角度は現在見えないようにしています。")).toBeVisible();
});

