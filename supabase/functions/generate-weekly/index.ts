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

    const [{ data: notes, error: notesError }, { data: documents, error: documentsError }, { data: insights, error: insightsError }] = await Promise.all([
      client.from("notes").select("id,title,content,type,mood,tags,done,result_text,result_outcome,completed_at,source_insight_key,created_at,updated_at").gte("updated_at", startIso).lt("updated_at", endExclusive.toISOString()).order("updated_at", { ascending: false }).limit(100),
      client.from("documents").select("id,name,summary,keywords,parsed_at").gte("parsed_at", startIso).lt("parsed_at", endExclusive.toISOString()).order("parsed_at", { ascending: false }).limit(40),
      client.from("insights").select("insight_key,label,topic,title,detail,evidence_count,confidence,status,evidence_refs,updated_at").order("updated_at", { ascending: false }).limit(10),
    ]);
    if (notesError) throw notesError;
    if (documentsError) throw documentsError;
    if (insightsError) throw insightsError;

    const inputCount = (notes?.length || 0) + (documents?.length || 0);
    const usableInsights = (insights || []).filter((insight) => insight.status !== "rejected");
    const primaryInsight = [...usableInsights].sort((a, b) => Number(b.status === "confirmed") - Number(a.status === "confirmed") || Number(b.confidence) - Number(a.confidence))[0];
    const suggestedLayout = inputCount <= 3 ? "sparse" : inputCount >= 9 ? "dense" : "balanced";
    const report = await generateJson(
      "你是 Action 的周报编辑。把本周输入、已确认或待确认洞察、行动结果整理成决策输入，而不是流水账。输出对象包含 theme、summary、topics、layout、explanation、action_feedback、next_experiment。layout 只能是 sparse、balanced、dense，并结合输入量和主题复杂度选择。next_experiment 包含 title、detail、duration_days、minutes_per_day、metric、success_criteria。信息不足时明确写出证据不足，不要编造。",
      { suggested_layout: suggestedLayout, notes: notes || [], documents: documents || [], insights: usableInsights },
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
