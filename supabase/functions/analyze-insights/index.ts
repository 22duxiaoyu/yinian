import { authenticatedClient, corsHeaders, functionError, generateJson, json } from "../_shared/runtime.ts";

type GeneratedInsight = {
  id?: string;
  label?: string;
  topic?: string;
  title?: string;
  detail?: string;
  evidence?: number;
  confidence?: number;
  accent?: string;
  evidence_refs?: unknown[];
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);

  try {
    const { client, user } = await authenticatedClient(request);
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const [{ data: notes, error: notesError }, { data: documents, error: documentsError }] = await Promise.all([
      client.from("notes").select("id,title,content,type,mood,tags,done,created_at,updated_at").gte("updated_at", since).order("updated_at", { ascending: false }).limit(80),
      client.from("documents").select("id,name,summary,keywords,parsed_at").gte("parsed_at", since).order("parsed_at", { ascending: false }).limit(30),
    ]);
    if (notesError) throw notesError;
    if (documentsError) throw documentsError;

    const generated = await generateJson(
      "你是 Action 的洞察引擎。找出跨记录重复出现、能够被原文验证的模式。避免把单条表达推断成稳定结论。输出对象必须包含 insights 数组，恰好 3 条；每条包含 id、label、topic、title、detail、evidence、confidence、accent、evidence_refs。confidence 为 0-100 整数，evidence_refs 只引用输入中的 id。第一条是最重要判断，后两条是潜在张力和正向变化。",
      { notes: notes || [], documents: documents || [] },
    ) as { insights?: GeneratedInsight[] };

    const insights = (Array.isArray(generated.insights) ? generated.insights : []).slice(0, 3).map((item, index) => ({
      user_id: user.id,
      insight_key: String(item.id || `insight-${index + 1}`),
      label: String(item.label || "行为模式"),
      topic: String(item.topic || "待确认主题"),
      title: String(item.title || "需要更多输入才能形成稳定判断"),
      detail: String(item.detail || "当前证据仍然有限。"),
      evidence_count: Math.max(0, Number(item.evidence || 0)),
      confidence: Math.min(100, Math.max(0, Math.round(Number(item.confidence || 0)))),
      accent: String(item.accent || ["#667d92", "#b7835a", "#718f7f"][index]),
      status: "pending",
      evidence_refs: Array.isArray(item.evidence_refs) ? item.evidence_refs : [],
    }));
    if (!insights.length) throw new Error("OPENAI_EMPTY_RESPONSE");

    const { data, error } = await client.from("insights").upsert(insights, { onConflict: "user_id,insight_key" }).select();
    if (error) throw error;
    return json(request, { insights: data });
  } catch (error) {
    return functionError(request, error);
  }
});
