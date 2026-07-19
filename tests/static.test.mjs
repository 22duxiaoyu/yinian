import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("index does not contain duplicate element ids", async () => {
  const html = await read("index.html");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], []);
});

test("all cached element selectors exist in the page", async () => {
  const [html, app] = await Promise.all([read("index.html"), read("app.js")]);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const cached = [...app.matchAll(/document\.querySelector\("#([A-Za-z0-9_-]+)"\)/g)].map((match) => match[1]);
  const missing = [...new Set(cached.filter((id) => !ids.has(id)))];
  assert.deepEqual(missing, []);
});

test("cloud schema contains the product completion contracts", async () => {
  const [migration, cloud] = await Promise.all([
    read("supabase/migrations/20260715090000_product_completion.sql"),
    read("cloud.js"),
  ]);
  for (const contract of ["insight_feedback", "analytics_events", "product_feedback", "result_outcome", "analytics_funnel_daily"]) {
    assert.match(migration, new RegExp(contract));
  }
  for (const contract of ["updateInsightStatus", "syncWeeklyReports", "exportWorkspace", "submitFeedback"]) {
    assert.match(cloud, new RegExp(contract));
  }
});

test("privacy and account deletion are represented in UI and cloud", async () => {
  const [html, privacy, deletion] = await Promise.all([
    read("index.html"),
    read("privacy.html"),
    read("supabase/functions/delete-account/index.ts"),
  ]);
  assert.match(html, /删除账户与全部数据/);
  assert.match(privacy, /DeepSeek/);
  assert.match(deletion, /auth\.admin\.deleteUser/);
  assert.match(deletion, /action-documents/);
});

test("browser assets do not contain private service credentials", async () => {
  const assets = await Promise.all([
    read("index.html"),
    read("app.js"),
    read("cloud.js"),
    read("cloud-config.js"),
  ]);
  const browserBundle = assets.join("\n");
  assert.doesNotMatch(browserBundle, /SUPABASE_SERVICE_ROLE_KEY|DEEPSEEK_API_KEY/);
  assert.doesNotMatch(browserBundle, /(?:sk|ds)-[A-Za-z0-9_-]{20,}/);
});

test("email OTP and admin analytics contracts are present", async () => {
  const [html, app, cloud, adminHtml, adminApp, adminFunction] = await Promise.all([
    read("index.html"),
    read("app.js"),
    read("cloud.js"),
    read("admin.html"),
    read("admin.js"),
    read("supabase/functions/admin-analytics/index.ts"),
  ]);
  assert.doesNotMatch(html, /id="authStatus"/);
  assert.match(html, /id="authOtpInputs"/);
  assert.match(html, /id="errorDialog"/);
  assert.match(app, /verifySignupOtp/);
  assert.match(app, /showErrorDialog/);
  assert.match(app, /describeAuthFailure/);
  assert.match(cloud, /auth\.verifyOtp/);
  assert.match(cloud, /auth\.signInWithOAuth/);
  assert.match(html, /id="appleSignInButton"/);
  assert.match(cloud, /oauthProviders/);
  assert.match(app, /SUPPORTED_SIGNUP_EMAIL_DOMAINS/);
  assert.match(adminHtml, /核心转化漏斗/);
  assert.match(adminHtml, /id="adminErrorDialog"/);
  assert.match(adminApp, /admin-analytics/);
  assert.match(adminApp, /showAdminErrorDialog/);
  assert.match(adminFunction, /ADMIN_EMAIL_HASHES/);
  assert.match(adminFunction, /SUPABASE_SERVICE_ROLE_KEY/);
});
