import { expect, test } from "@playwright/test";

test("A. q 検索で一覧が絞られる", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("home-search-input").fill("転職");
  await page.getByTestId("home-search-submit").click();

  await expect(page).toHaveURL(/q=%E8%BB%A2%E8%81%B7/);
  await expect(page.getByRole("heading", { name: "転職したい気持ちと今の安心感で揺れている" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "朝活が3日坊主になりやすい理由を整理したい" })).toHaveCount(0);
});

test("B. postType フィルタで一覧が絞られる", async ({ page }) => {
  await page.goto("/?postType=WORRY");

  await expect(page.getByRole("heading", { name: "転職したい気持ちと今の安心感で揺れている" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SNSの反応が少ないと発信内容まで疑ってしまう" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "朝活が3日坊主になりやすい理由を整理したい" })).toHaveCount(0);
});

test("C. tag 絞り込みが効く", async ({ page }) => {
  await page.goto("/?tag=SNS");

  await expect(page.getByRole("heading", { name: "SNSの反応が少ないと発信内容まで疑ってしまう" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "転職したい気持ちと今の安心感で揺れている" })).toHaveCount(0);
});

test("D. q/postType/tag/sort の併用で query が維持される", async ({ page }) => {
  await page.goto("/?q=%E5%B0%86%E6%9D%A5&postType=HYPOTHESIS&tag=%E5%B0%86%E6%9D%A5&sort=hot");

  await expect(page).toHaveURL(/q=%E5%B0%86%E6%9D%A5/);
  await expect(page).toHaveURL(/postType=HYPOTHESIS/);
  await expect(page).toHaveURL(/tag=%E5%B0%86%E6%9D%A5/);
  await expect(page).toHaveURL(/sort=hot/);

  await page.getByRole("link", { name: "深堀り順" }).click();
  await expect(page).toHaveURL(/q=%E5%B0%86%E6%9D%A5/);
  await expect(page).toHaveURL(/postType=HYPOTHESIS/);
  await expect(page).toHaveURL(/tag=%E5%B0%86%E6%9D%A5/);
  await expect(page).toHaveURL(/sort=deep/);
});

test("E. 条件解除で通常一覧へ戻れる", async ({ page }) => {
  await page.goto("/?q=SNS&postType=WORRY&tag=SNS&sort=deep");

  await page.getByRole("link", { name: "絞り込みを外す" }).click();
  await expect(page).toHaveURL(/sort=deep/);
  await expect(page).not.toHaveURL(/q=/);
  await expect(page).not.toHaveURL(/postType=/);
  await expect(page).not.toHaveURL(/tag=/);

  await page.getByRole("link", { name: "全体へ戻る" }).click();
  await expect(page).toHaveURL("/");
});
