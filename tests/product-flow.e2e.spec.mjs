import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  await page.locator("#demoButton").click();
  await expect(page.locator("#authScreen")).toHaveClass(/hidden/);
});

async function openSidebarOnMobile(page) {
  if ((page.viewportSize()?.width || 1000) <= 760) {
    await page.locator("#mobileMenu").click();
    await expect(page.locator("#sidebar")).toHaveClass(/open/);
  }
}

async function goTo(page, view) {
  await openSidebarOnMobile(page);
  await page.locator(`[data-view="${view}"]`).click();
}

test("capture, confirm, act and review form a complete local loop", async ({ page }) => {
  const before = Number(await page.locator("#navSignalCount").getAttribute("data-motion-value"));
  await page.locator("#quickCapture").click();
  await page.locator("#noteTitle").fill("验证新用户是否理解第一屏");
  await page.locator("#noteContent").fill("今天让三位同学看了第一屏，两位没有理解产品会把洞察转成行动。");
  await page.locator("#noteTags").fill("用户理解, 作品集");
  await page.locator("#noteForm button[type=submit]").click();
  await expect(page.locator("#navSignalCount")).toHaveAttribute("data-motion-value", String(before + 1));

  await goTo(page, "insights");
  await page.locator("#insightLeadConfirm").click();
  await expect(page.locator("#insightLeadAction")).toBeVisible();
  await page.locator("#insightLeadAction").click();
  await page.locator("#noteContent").fill("把第一屏交给一位目标用户复述，记录他理解到的核心价值。");
  await page.locator("#noteForm button[type=submit]").click();

  await goTo(page, "actions");
  await page.locator("#todoActions .board-complete-control").first().click();
  await expect(page.locator("#actionFeedbackModal")).toBeVisible({ timeout: 3000 });
  await page.locator("#actionResultText").fill("用户能够复述核心价值，但没有注意到证据回溯能力。");
  await page.locator("#actionFeedbackForm button[type=submit]").click();
  await expect(page.locator("#doneActions")).toContainText("用户能够复述核心价值");

  await goTo(page, "weekly");
  await expect(page.locator("#weeklyHistorySelect")).toBeVisible();
  await expect(page.locator("#weeklyTrend")).not.toBeEmpty();
});

test("settings expose backup, feedback and deliberate account deletion", async ({ page }) => {
  await openSidebarOnMobile(page);
  await page.locator("#profileButton").click();
  await page.locator("#settingsButton").click();
  await expect(page.locator("#exportNotes")).toContainText("导出完整数据");
  await page.locator("#productFeedbackMessage").fill("希望周报历史切换更快");
  await page.locator("#submitProductFeedback").click();
  await expect(page.locator("#toast")).toContainText("保存在本机");
  await page.locator("#showDeleteAccount").click();
  await expect(page.locator("#deleteAccountConfirm")).toBeVisible();
  await expect(page.locator("#deleteAccountButton")).toBeDisabled();
  await page.locator("#deleteAccountInput").fill("删除");
  await expect(page.locator("#deleteAccountButton")).toBeEnabled();
});

test("main workspace has no horizontal page overflow", async ({ page }) => {
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
});
