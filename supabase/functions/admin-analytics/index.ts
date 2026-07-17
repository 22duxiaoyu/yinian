import { createClient } from "npm:@supabase/supabase-js@2";
import { authenticatedClient, corsHeaders, functionError, json } from "../_shared/runtime.ts";

type AnalyticsEvent = {
  user_id: string | null;
  event_name: string;
  page: string;
  properties: Record<string, unknown>;
  created_at: string;
};

const funnelStages = [
  ["registered", "完成注册"],
  ["first_input_saved", "保存首条输入"],
  ["third_source_added", "形成三条上下文"],
  ["insight_analysis_completed", "完成 AI 洞察"],
  ["insight_evidence_opened", "查看原始依据"],
  ["insight_confirmed", "确认洞察"],
  ["insight_converted_to_action", "转成行动"],
  ["action_completed", "完成行动"],
  ["weekly_report_viewed", "查看周报"],
] as const;

const featureLabels: Record<string, string> = {
  source_saved: "记录灵感",
  document_imported: "导入文档",
  insight_analysis_completed: "AI 洞察",
  insight_evidence_opened: "查看证据",
  insight_confirmed: "确认洞察",
  insight_rejected: "驳回洞察",
  insight_converted_to_action: "转成行动",
  action_completed: "完成行动",
  action_reopened: "恢复行动",
  action_result_saved: "回填结果",
  weekly_report_viewed: "查看周报",
  product_feedback_submitted: "提交反馈",
};

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function isAdmin(userId: string, email = "") {
  const allowedIds = (Deno.env.get("ADMIN_USER_IDS") || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (allowedIds.includes(userId)) return true;
  const allowedHashes = (Deno.env.get("ADMIN_EMAIL_HASHES") || "").split(",").map((item) => item.trim()).filter(Boolean);
  return Boolean(email && allowedHashes.includes(await sha256(email)));
}

function maskEmail(email = "") {
  const [name, domain] = email.split("@");
  if (!domain) return "未公开";
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(6, name.length - 2)))}@${domain}`;
}

function uniqueUsers(events: AnalyticsEvent[], eventName?: string) {
  return new Set(events.filter((event) => event.user_id && (!eventName || event.event_name === eventName)).map((event) => event.user_id as string));
}

function eventCount(events: AnalyticsEvent[], eventName: string) {
  return events.filter((event) => event.event_name === eventName).length;
}

async function loadAllEvents(service: ReturnType<typeof createClient>, since: string) {
  const rows: AnalyticsEvent[] = [];
  for (let from = 0; from < 50000; from += 1000) {
    const { data, error } = await service.from("analytics_events")
      .select("user_id,event_name,page,properties,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...((data || []) as AnalyticsEvent[]));
    if ((data || []).length < 1000) break;
  }
  return rows;
}

async function loadUsers(service: ReturnType<typeof createClient>) {
  const users = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  try {
    const { user } = await authenticatedClient(request);
    if (!(await isAdmin(user.id, user.email || ""))) return json(request, { error: "当前账号没有管理权限" }, 403);

    const body = await request.json().catch(() => ({}));
    const periodDays = [7, 30, 90].includes(Number(body.period_days)) ? Number(body.period_days) : 30;
    const sinceDate = new Date();
    sinceDate.setUTCHours(0, 0, 0, 0);
    sinceDate.setUTCDate(sinceDate.getUTCDate() - periodDays + 1);
    const since = sinceDate.toISOString();

    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRoleKey) throw new Error("ADMIN_SERVICE_NOT_CONFIGURED");
    const service = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const [users, events, feedbackResult] = await Promise.all([
      loadUsers(service),
      loadAllEvents(service, since),
      service.from("product_feedback")
        .select("user_id,score,category,message,context,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (feedbackResult.error) throw feedbackResult.error;

    const periodUsers = users.filter((item) => new Date(item.created_at) >= sinceDate);
    const activeUsers = uniqueUsers(events);
    const eventUsers = new Map<string, Set<string>>();
    Object.keys(featureLabels).forEach((name) => eventUsers.set(name, uniqueUsers(events, name)));

    const funnel = funnelStages.map(([key, label], index) => {
      const count = key === "registered" ? periodUsers.length : uniqueUsers(events, key).size;
      const previousKey = funnelStages[index - 1]?.[0];
      const previousCount = index === 1 ? periodUsers.length : previousKey ? uniqueUsers(events, previousKey).size : count;
      return { key, label, users: count, conversion: index === 0 ? 100 : previousCount ? Math.round((count / previousCount) * 100) : 0 };
    });

    const features = Object.entries(featureLabels).map(([key, label]) => ({
      key,
      label,
      events: eventCount(events, key),
      users: eventUsers.get(key)?.size || 0,
    })).sort((a, b) => b.events - a.events);

    const pages = [...new Set(events.filter((event) => event.event_name === "page_viewed").map((event) => event.page).filter(Boolean))]
      .map((page) => ({
        page,
        views: events.filter((event) => event.event_name === "page_viewed" && event.page === page).length,
        users: new Set(events.filter((event) => event.event_name === "page_viewed" && event.page === page).map((event) => event.user_id).filter(Boolean)).size,
      })).sort((a, b) => b.views - a.views);

    const daily = Array.from({ length: periodDays }, (_, index) => {
      const day = new Date(sinceDate);
      day.setUTCDate(day.getUTCDate() + index);
      const date = day.toISOString().slice(0, 10);
      const dayEvents = events.filter((event) => event.created_at.slice(0, 10) === date);
      return {
        date,
        active_users: uniqueUsers(dayEvents).size,
        new_users: users.filter((item) => item.created_at.slice(0, 10) === date).length,
        analyses: eventCount(dayEvents, "insight_analysis_completed"),
        actions_completed: eventCount(dayEvents, "action_completed"),
      };
    });

    const userById = new Map(users.map((item) => [item.id, item]));
    const latestEventByUser = new Map<string, string>();
    events.forEach((event) => {
      if (event.user_id) latestEventByUser.set(event.user_id, event.created_at);
    });
    const activationOrder = funnelStages.slice(1).map(([key]) => key);
    const userRows = users.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 100).map((item) => {
      const userEvents = events.filter((event) => event.user_id === item.id);
      let activationStage = "完成注册";
      activationOrder.forEach((key) => {
        if (userEvents.some((event) => event.event_name === key)) activationStage = funnelStages.find(([stage]) => stage === key)?.[1] || activationStage;
      });
      return {
        id: item.id,
        email: maskEmail(item.email || ""),
        created_at: item.created_at,
        last_active_at: latestEventByUser.get(item.id) || item.last_sign_in_at || item.created_at,
        activation_stage: activationStage,
        event_count: userEvents.length,
      };
    });

    const started = eventCount(events, "insight_analysis_started");
    const completed = eventCount(events, "insight_analysis_completed");
    const failed = eventCount(events, "insight_analysis_failed");
    const confirmed = eventCount(events, "insight_confirmed");
    const rejected = eventCount(events, "insight_rejected");
    const outcomeCounts = { supported: 0, unclear: 0, disproved: 0 };
    events.filter((event) => event.event_name === "action_result_saved").forEach((event) => {
      const outcome = String(event.properties?.outcome || "");
      if (outcome in outcomeCounts) outcomeCounts[outcome as keyof typeof outcomeCounts] += 1;
    });
    const durations = events
      .filter((event) => event.event_name === "insight_analysis_completed")
      .map((event) => Number(event.properties?.duration_ms || 0))
      .filter((value) => value > 0);

    const feedback = (feedbackResult.data || []).map((item) => ({
      score: item.score,
      category: item.category,
      message: item.message,
      page: item.context?.page || "",
      created_at: item.created_at,
      user_email: maskEmail(userById.get(item.user_id)?.email || ""),
    }));

    return json(request, {
      generated_at: new Date().toISOString(),
      period_days: periodDays,
      overview: {
        total_users: users.length,
        new_users: periodUsers.length,
        active_users: activeUsers.size,
        analyses_completed: completed,
        actions_completed: eventCount(events, "action_completed"),
        weekly_viewers: uniqueUsers(events, "weekly_report_viewed").size,
      },
      funnel,
      features,
      pages,
      daily,
      ai_quality: {
        analyses_started: started,
        analyses_completed: completed,
        analyses_failed: failed,
        success_rate: started ? Math.round((completed / started) * 100) : 0,
        average_duration_ms: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0,
        insights_confirmed: confirmed,
        insights_rejected: rejected,
        acceptance_rate: confirmed + rejected ? Math.round((confirmed / (confirmed + rejected)) * 100) : 0,
        evidence_open_rate: completed ? Math.round((eventCount(events, "insight_evidence_opened") / completed) * 100) : 0,
        outcomes: outcomeCounts,
      },
      feedback,
      users: userRows,
    });
  } catch (error) {
    return functionError(request, error);
  }
});
