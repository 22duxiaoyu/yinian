import { authenticatedClient, corsHeaders, functionError, generateJson, json } from "../_shared/runtime.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);

  try {
    const body = await request.json().catch(() => ({}));
    const question = String(body.question || "").trim();
    if (!question) return json(request, { error: "Question is required" }, 400);
    const { client } = await authenticatedClient(request);
    const [{ data: notes, error: notesError }, { data: documents, error: documentsError }, { data: insights, error: insightsError }] = await Promise.all([
      client.from("notes").select("id,title,content,type,mood,tags,done,updated_at").order("updated_at", { ascending: false }).limit(50),
      client.from("documents").select("id,name,summary,keywords,parsed_at").order("parsed_at", { ascending: false }).limit(20),
      client.from("insights").select("insight_key,topic,title,detail,confidence,status,evidence_refs").order("updated_at", { ascending: false }).limit(10),
    ]);
    if (notesError) throw notesError;
    if (documentsError) throw documentsError;
    if (insightsError) throw insightsError;

    const answer = await generateJson(
      "你是 Action 的思考助手。只能根据用户自己的记录、文档摘要和洞察回答。清楚区分原文事实、合理推断和仍需验证的部分。不要替用户做决定。输出 JSON 对象，包含 answer、basis、next_step 三个字符串；answer 直接回答问题，basis 简述引用依据，next_step 给出一个可选的最小动作。",
      { question, notes: notes || [], documents: documents || [], insights: insights || [] },
    ) as Record<string, unknown>;

    return json(request, {
      answer: String(answer.answer || "当前记录还不足以回答这个问题。"),
      basis: String(answer.basis || "尚未找到足够的原始依据。"),
      next_step: String(answer.next_step || "可以先补充一条与问题直接相关的记录。"),
    });
  } catch (error) {
    return functionError(request, error);
  }
});
