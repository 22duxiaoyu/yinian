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

test("registration moves into an inline six-digit email verification step", async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await expect(page.locator("#authStatus")).toHaveCount(0);
  await page.getByRole("tab", { name: "注册" }).click();
  await page.locator("#authName").fill("new-user@gmail.com");
  await page.locator("#authPasscode").fill("secret88");
  await page.locator("#authConfirmPasscode").fill("secret88");
  await page.evaluate(() => {
    window.ActionCloud.signUp = async () => ({ user: { id: "signup-user", identities: [{ id: "identity" }] }, session: null });
  });
  await page.getByRole("button", { name: "创建账号" }).click();
  await expect(page.getByRole("heading", { name: "输入六位验证码" })).toBeVisible();
  await expect(page.locator("#authOtpInputs input")).toHaveCount(6);
  await expect(page.getByText("ne••••@gmail.com")).toBeVisible();
});

test("registration errors explain the reason in a global dialog and at the field", async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await page.getByRole("tab", { name: "注册" }).click();
  await page.locator("#authName").fill("not-an-email");
  await page.locator("#authPasscode").fill("secret88");
  await page.locator("#authConfirmPasscode").fill("secret88");
  await page.getByRole("button", { name: "创建账号" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.locator("#errorDialogMessage")).toContainText("邮箱格式不正确");
  await page.locator("#errorDialogClose").click();
  await expect(page.locator("#authName")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#authNameHelp")).toContainText("完整地址");
});

test("registration accepts first-release email providers and rejects unsupported domains", async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await page.getByRole("tab", { name: "注册" }).click();
  await expect(page.getByRole("heading", { name: "创建 Action 账号" })).toBeVisible();
  await expect(page.locator("#authEmailSupport")).toBeHidden();
  await expect(page.locator("#authEmailSupport")).toContainText("Gmail");
  await expect(page.locator("#authEmailSupport")).toContainText("QQ");
  await expect(page.locator("#authEmailSupport")).toContainText("新浪");
  await expect(page.locator("#authEmailSupport")).toContainText("网易");
  await page.locator("#authName").fill("new-user@outlook.com");
  await page.locator("#authPasscode").fill("secret88");
  await page.locator("#authConfirmPasscode").fill("secret88");
  await page.getByRole("button", { name: "创建账号" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.locator("#errorDialogMessage")).toContainText("首版注册目前支持");
  await page.locator("#errorDialogClose").click();

  await page.evaluate(() => {
    window.ActionCloud.signUp = async () => ({ user: { id: "signup-user", identities: [{ id: "identity" }] }, session: null });
  });
  await page.locator("#authName").fill("new-user@qq.com");
  await page.getByRole("button", { name: "创建账号" }).click();
  await expect(page.getByRole("heading", { name: "输入六位验证码" })).toBeVisible();
});

test("authentication stays focused and fits a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "登录 Action" })).toBeVisible();
  await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看示例空间" })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientHeight: document.documentElement.clientHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight + 1);
});

test("Apple account login stays hidden until the provider is configured", async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await expect(page.locator("#authProviderSection")).toBeHidden();
});

test("admin dashboard renders aggregated funnel data", async ({ page }) => {
  await page.goto("/admin.html");
  await page.evaluate(() => {
    window.ActionCloud.signIn = async () => ({ user: { id: "admin" } });
    window.ActionCloud.invoke = async () => ({
      generated_at: new Date().toISOString(), period_days: 30,
      overview: { total_users: 12, new_users: 4, active_users: 7, analyses_completed: 5, actions_completed: 3, weekly_viewers: 2 },
      funnel: [{ key: "registered", label: "完成注册", users: 4, conversion: 100 }, { key: "first_input_saved", label: "保存首条输入", users: 3, conversion: 75 }],
      features: [{ key: "source_saved", label: "记录灵感", events: 9, users: 3 }],
      pages: [{ page: "overview", views: 8, users: 4 }],
      daily: [{ date: "2026-07-16", active_users: 4, new_users: 2, analyses: 2, actions_completed: 1 }],
      ai_quality: { analyses_started: 5, analyses_completed: 5, analyses_failed: 0, success_rate: 100, average_duration_ms: 2400, insights_confirmed: 3, insights_rejected: 1, acceptance_rate: 75, evidence_open_rate: 80, outcomes: { supported: 2, unclear: 1, disproved: 0 } },
      users: [{ email: "ad••••@example.com", created_at: "2026-07-16T08:00:00Z", last_active_at: "2026-07-16T09:00:00Z", activation_stage: "确认洞察", event_count: 8 }],
      feedback: [{ score: 5, message: "流程很清楚", page: "overview", created_at: "2026-07-16T09:00:00Z", user_email: "ad••••@example.com" }],
    });
  });
  await page.locator("#adminEmail").fill("admin@example.com");
  await page.locator("#adminPassword").fill("secret88");
  await page.getByRole("button", { name: "登录数据中心" }).click();
  await expect(page.getByText("累计注册")).toBeVisible();
  await expect(page.getByText("12", { exact: true })).toBeVisible();
  await expect(page.getByText("核心转化漏斗")).toBeVisible();
});

test("admin login errors use the same visible dialog pattern", async ({ page }) => {
  await page.goto("/admin.html");
  await page.evaluate(() => {
    window.ActionCloud.signIn = async () => { throw new Error("Invalid login credentials"); };
  });
  await page.locator("#adminEmail").fill("admin@example.com");
  await page.locator("#adminPassword").fill("wrong-password");
  await page.getByRole("button", { name: "登录数据中心" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.locator("#adminErrorDialogMessage")).toContainText("邮箱或密码不正确");
});
