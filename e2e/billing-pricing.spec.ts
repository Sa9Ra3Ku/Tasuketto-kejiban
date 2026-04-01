import { expect, test } from "@playwright/test";

import { signInAsAyano } from "./helpers/auth-playwright";

test("A. /pricing が開く", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: "料金" })).toBeVisible();
  await expect(page.getByTestId("pricing-supporter-card")).toBeVisible();
});

test("B. 未ログイン時は自然にサインイン導線が見える", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByTestId("pricing-signin-link")).toBeVisible();
  await expect(page.getByTestId("pricing-signup-link")).toBeVisible();
});

test("C. ログイン時は加入導線が見える", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/pricing");
  await expect(page.getByTestId("pricing-join-supporter")).toBeVisible();
});

test("D. /billing は未ログインでサインインへつながる", async ({ page }) => {
  await page.goto("/billing");
  await expect(page).toHaveURL(/\/signin/);
});

test("E. /billing の会員状態表示が崩れない", async ({ page }) => {
  await signInAsAyano(page);
  await page.goto("/billing");
  await expect(page.getByTestId("billing-page")).toBeVisible();
  await expect(page.getByTestId("billing-membership-label")).toBeVisible();
});

