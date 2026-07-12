import { authenticatedClient, corsHeaders, functionError, generateJson, json } from "../_shared/runtime.ts";

type GeneratedInsight = {
  id?: string;
  label?: string;
  topic?: string;
  title?: string;
  detail?: string;
  evidence?: unknown;
  confidence?: unknown;
  accent?: unknown;
  evidence_refs?: unknown[];
};

function collectInsights(generated: unknown): GeneratedInsight[] {
  const normalize = (item: unknown): GeneratedInsight | null => {
    if (item && typeof item === "object") return item as GeneratedInsight;
    if (typeof item !== "string" || !item.trim()) return null;
    try {
      const parsed = JSON.parse(item);
      if (parsed && typeof parsed === "object") return parsed as GeneratedInsight;
    } catch {
      return { title: item, detail: item };
    }
    return null;
  };
  const normalizeList = (items: unknown[]) => items.map(normalize).filter((item): item is GeneratedInsight => Boolean(item));
  if (Array.isArray(generated)) return normalizeList(generated);
  if (!generated || typeof generated !== "object") return [];
  const value = (generated as { insights?: unknown }).insights;
  if (Array.isArray(value)) return normalizeList(value);
  if (value && typeof value === "object") {
    return normalizeList(Object.values(value));
  }
  return [];
}

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
    if (!(notes?.length || documents?.length)) return json(request, { insights: [] });

    const generated = await generateJson(
      "你是 Action 的洞察引擎。找出跨记录重复出现、能够被原文验证的模式。避免把单条表达推断成稳定结论。全部文案使用中文。输出对象必须包含 insights 数组，恰好 3 条；每条包含 id、label、topic、title、detail、evidence、confidence、accent、evidence_refs。evidence 必须是证据条数整数，confidence 必须是 0-100 整数，accent 必须是六位十六进制颜色，evidence_refs 只引用输入中的 id。第一条是最重要判断，后两条是潜在张力和正向变化。严格参考这个顶层结构：{\"insights\":[{\"id\":\"pattern\",\"label\":\"行为模式\",\"topic\":\"主题\",\"title\":\"判断\",\"detail\":\"解释\",\"evidence\":2,\"confidence\":80,\"accent\":\"#667d92\",\"evidence_refs\":[]}]}。",
      { notes: notes || [], documents: documents || [] },
    );

    const palette = ["#667d92", "#b7835a", "#718f7f"];
    const generatedItems = collectInsights(generated);
    if (!generatedItems.length) {
      const topKeys = generated && typeof generated === "object" && !Array.isArray(generated) ? Object.keys(generated as Record<string, unknown>) : [];
      const value = generated && typeof generated === "object" && !Array.isArray(generated) ? (generated as { insights?: unknown }).insights : generated;
      console.warn("DeepSeek insight schema mismatch", { topKeys, valueType: Array.isArray(value) ? "array" : typeof value });
    }
    const insights = generatedItems.slice(0, 3).map((item, index) => {
      const evidence = Number(item.evidence);
      const confidence = Number(item.confidence);
      const accent = String(item.accent || "");
      return {
        user_id: user.id,
        insight_key: `insight-${index + 1}`,
        label: String(item.label || "行为模式"),
        topic: String(item.topic || "待确认主题"),
        title: String(item.title || "需要更多输入才能形成稳定判断"),
        detail: String(item.detail || "当前证据仍然有限。"),
        evidence_count: Number.isFinite(evidence) ? Math.max(0, Math.round(evidence)) : 0,
        confidence: Number.isFinite(confidence) ? Math.min(100, Math.max(0, Math.round(confidence))) : 0,
        accent: /^#[0-9a-f]{6}$/i.test(accent) ? accent : palette[index],
        status: "pending",
        evidence_refs: Array.isArray(item.evidence_refs) ? item.evidence_refs : [],
      };
    });
    if (!insights.length) throw new Error("DEEPSEEK_EMPTY_RESPONSE");

    const { data, error } = await client.from("insights").upsert(insights, { onConflict: "user_id,insight_key" }).select();
    if (error) throw error;
    return json(request, { insights: data });
  } catch (error) {
    return functionError(request, error);
  }
});
