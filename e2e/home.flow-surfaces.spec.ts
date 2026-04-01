import { expect, test } from "@playwright/test";

test("A. トップに「今動いている流れ」と「まだ深堀りが少ない流れ」が表示される", async ({ page }) => {
  await page.goto("/");

  const active = page.getByTestId("home-active-flows-section");
  const shallow = page.getByTestId("home-shallow-flows-section");

  await expect(active.getByRole("heading", { name: "今動いている流れ" })).toBeVisible();
  await expect(shallow.getByRole("heading", { name: "まだ深堀りが少ない流れ" })).toBeVisible();
});

test("B. sort のみ指定時も補助セクションは表示される", async ({ page }) => {
  await page.goto("/?sort=deep");

  await expect(page.getByTestId("home-active-flows-section")).toBeVisible();
  await expect(page.getByTestId("home-shallow-flows-section")).toBeVisible();
});

test("C. q 検索中は補助セクションが非表示", async ({ page }) => {
  await page.goto("/?q=%E8%BB%A2%E8%81%B7");

  await expect(page.getByTestId("home-active-flows-section")).toHaveCount(0);
  await expect(page.getByTestId("home-shallow-flows-section")).toHaveCount(0);
});

test("D. 補助セクションから詳細へ遷移してもページが崩れない", async ({ page }) => {
  await page.goto("/");

  const active = page.getByTestId("home-active-flows-section");
  const firstActiveLink = active.locator('[data-testid^="post-card-link-"]').first();
  await expect(firstActiveLink).toBeVisible();
  await firstActiveLink.click();

  await expect(page.getByRole("heading", { name: "投稿の深堀り" })).toBeVisible();
  await expect(page.getByTestId("back-to-discovery")).toBeVisible();

  await page.getByTestId("back-to-discovery").click();
  await expect(page).toHaveURL("/");
});

test("E. 浅い流れセクションにカードがあるとき、押して詳細へ行ける", async ({ page }) => {
  await page.goto("/");

  const shallow = page.getByTestId("home-shallow-flows-section");
  const shallowLink = shallow.locator('[data-testid^="post-card-link-"]').first();
  const count = await shallowLink.count();
  if (count === 0) {
    test.skip();
    return;
  }

  await shallowLink.click();
  await expect(page.getByRole("heading", { name: "投稿の深堀り" })).toBeVisible();
  await expect(page.locator("main")).toBeVisible();
});
