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
  assert.match(cloud, /normalizeFunctionError/);
  assert.match(cloud, /response\.clone/);
  assert.match(app, /SUPPORTED_SIGNUP_EMAIL_DOMAINS/);
  assert.match(adminHtml, /核心转化漏斗/);
  assert.match(adminHtml, /id="adminErrorDialog"/);
  assert.match(adminApp, /admin-analytics/);
  assert.match(adminApp, /showAdminErrorDialog/);
  assert.match(adminFunction, /ADMIN_EMAIL_HASHES/);
  assert.match(adminFunction, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("action agent requires approval and persists an execution loop", async () => {
  const [html, app, cloud, migration, orchestrator, weekly] = await Promise.all([
    read("index.html"),
    read("app.js"),
    read("cloud.js"),
    read("supabase/migrations/20260720090000_action_agent.sql"),
    read("supabase/functions/agent-orchestrate/index.ts"),
    read("supabase/functions/generate-weekly/index.ts"),
  ]);

  for (const id of ["agentOverviewCard", "agentStageStrip", "agentPlanPanel", "agentApprove", "weeklyAgentContext"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  for (const table of ["agent_goals", "agent_messages", "agent_plan_steps", "agent_runs", "agent_check_ins"]) {
    assert.match(migration, new RegExp(table));
  }
  for (const table of ["agent_goals", "agent_messages", "agent_plan_steps", "agent_check_ins"]) assert.match(cloud, new RegExp(table));
  assert.match(app, /只有你确认后/);
  assert.match(app, /runAgentAction\("approve"\)/);
  assert.match(app, /syncAgentStep/);
  assert.match(orchestrator, /action === "approve"/);
  assert.match(orchestrator, /action === "check_in"/);
  assert.match(orchestrator, /action === "complete_step"/);
  assert.match(orchestrator, /replan_required/);
  assert.match(weekly, /agent_progress/);
});

test("insight decisions create missing rows and feedback in one database transaction", async () => {
  const [cloud, migration] = await Promise.all([
    read("cloud.js"),
    read("supabase/migrations/20260721090000_atomic_insight_decision.sql"),
  ]);
  assert.match(cloud, /rpc\("decide_insight"/);
  assert.match(migration, /on conflict \(user_id, insight_key\) do update/);
  assert.match(migration, /insert into public\.insight_feedback/);
  assert.match(migration, /security invoker/);
});
