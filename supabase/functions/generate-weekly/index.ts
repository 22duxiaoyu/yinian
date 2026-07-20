import { authenticatedClient, corsHeaders, functionError, generateJson, json } from "../_shared/runtime.ts";

function weekBounds() {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);

  try {
    const { client, user } = await authenticatedClient(request);
    const { start, end } = weekBounds();
    const startIso = start.toISOString();
    const endExclusive = new Date(end);
    endExclusive.setUTCDate(end.getUTCDate() + 1);

    const [{ data: notes, error: notesError }, { data: documents, error: documentsError }, { data: insights, error: insightsError }, { data: agentGoal, error: agentGoalError }] = await Promise.all([
      client.from("notes").select("id,title,content,type,mood,tags,done,result_text,result_outcome,completed_at,source_insight_key,created_at,updated_at").gte("updated_at", startIso).lt("updated_at", endExclusive.toISOString()).order("updated_at", { ascending: false }).limit(100),
      client.from("documents").select("id,name,summary,keywords,parsed_at").gte("parsed_at", startIso).lt("parsed_at", endExclusive.toISOString()).order("parsed_at", { ascending: false }).limit(40),
      client.from("insights").select("insight_key,label,topic,title,detail,evidence_count,confidence,status,evidence_refs,updated_at").order("updated_at", { ascending: false }).limit(10),
      client.from("agent_goals").select("id,title,objective,status,success_criteria,current_plan_version,next_check_in_at,updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (notesError) throw notesError;
    if (documentsError) throw documentsError;
    if (insightsError) throw insightsError;
    if (agentGoalError) throw agentGoalError;

    let agentContext: Record<string, unknown> | null = null;
    if (agentGoal) {
      const [{ data: agentSteps, error: agentStepsError }, { data: agentCheckIns, error: agentCheckInsError }] = await Promise.all([
        client.from("agent_plan_steps").select("id,position,title,detail,status,success_criteria,due_at,version").eq("goal_id", agentGoal.id).eq("version", agentGoal.current_plan_version).order("position", { ascending: true }),
        client.from("agent_check_ins").select("status,response,outcome,due_at,answered_at").eq("goal_id", agentGoal.id).order("due_at", { ascending: false }).limit(12),
      ]);
      if (agentStepsError) throw agentStepsError;
      if (agentCheckInsError) throw agentCheckInsError;
      const steps = agentSteps || [];
      const completedSteps = steps.filter((step) => step.status === "completed");
      const nextStep = steps.find((step) => !["completed", "skipped"].includes(step.status));
      agentContext = {
        goal_id: agentGoal.id,
        title: agentGoal.title,
        objective: agentGoal.objective,
        status: agentGoal.status,
        success_criteria: agentGoal.success_criteria,
        completed_steps: completedSteps.length,
        total_steps: steps.length,
        next_step: nextStep?.title || "",
        next_check_in_at: agentGoal.next_check_in_at,
        steps,
        check_ins: agentCheckIns || [],
      };
    }

    const inputCount = (notes?.length || 0) + (documents?.length || 0);
    const usableInsights = (insights || []).filter((insight) => insight.status !== "rejected");
    const primaryInsight = [...usableInsights].sort((a, b) => Number(b.status === "confirmed") - Number(a.status === "confirmed") || Number(b.confidence) - Number(a.confidence))[0];
    const suggestedLayout = inputCount <= 3 ? "sparse" : inputCount >= 9 ? "dense" : "balanced";
    const report = await generateJson(
      "你是 Action 的周报编辑。把本周输入、已确认或待确认洞察、行动 Agent 的目标与计划、行动结果整理成决策输入，而不是流水账。输出对象包含 theme、summary、topics、layout、explanation、action_feedback、next_experiment。layout 只能是 sparse、balanced、dense，并结合输入量、主题复杂度与 Agent 执行进度选择。next_experiment 包含 title、detail、duration_days、minutes_per_day、metric、success_criteria。若 Agent 正在执行，下一步必须优先服务当前目标；信息不足时明确写出证据不足，不要编造。",
      { suggested_layout: suggestedLayout, notes: notes || [], documents: documents || [], insights: usableInsights, agent: agentContext },
    ) as Record<string, unknown>;

    const layout = ["sparse", "balanced", "dense"].includes(String(report.layout)) ? String(report.layout) : suggestedLayout;
    const payload = {
      ...report,
      layout,
      input_count: inputCount,
      action_count: (notes || []).filter((note) => note.type === "task").length,
      completed_action_count: (notes || []).filter((note) => note.type === "task" && note.done).length,
      insight_key: primaryInsight?.insight_key || "",
      insight_topic: primaryInsight?.topic || "",
      insight_confidence: Number(primaryInsight?.confidence || 0),
      evidence_count: Number(primaryInsight?.evidence_count || 0),
      evidence_refs: Array.isArray(primaryInsight?.evidence_refs) ? primaryInsight.evidence_refs : [],
      agent_progress: agentContext,
    };
    const row = {
      user_id: user.id,
      week_start: start.toISOString().slice(0, 10),
      week_end: end.toISOString().slice(0, 10),
      layout,
      theme: String(report.theme || "本周仍在积累足够的决策信号"),
      report: payload,
    };
    const { data, error } = await client.from("weekly_reports").upsert(row, { onConflict: "user_id,week_start" }).select().single();
    if (error) throw error;
    return json(request, { weekly_report: data });
  } catch (error) {
    return functionError(request, error);
  }
});
