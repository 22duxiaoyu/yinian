import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

const defaultOrigins = ["http://localhost:6002", "https://22duxiaoyu.github.io"];

export function corsHeaders(request: Request) {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") || defaultOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const requestOrigin = request.headers.get("origin") || "";
  const origin = configured.includes(requestOrigin) ? requestOrigin : configured[0];
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

export function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

export async function authenticatedClient(request: Request): Promise<{
  client: SupabaseClient;
  user: User;
}> {
  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!url || !publishableKey || !token) throw new Error("UNAUTHORIZED");

  const client = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("UNAUTHORIZED");
  return { client, user: data.user };
}

function extractResponseText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? (item as { content: unknown[] }).content
      : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") return text;
    }
  }
  throw new Error("OPENAI_EMPTY_RESPONSE");
}

export async function generateJson(instructions: string, input: unknown) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL");
  if (!apiKey || !model) throw new Error("OPENAI_NOT_CONFIGURED");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: `${instructions}\n只返回有效 JSON，不要使用 Markdown 代码块。`,
      input: JSON.stringify(input),
      max_output_tokens: 5000,
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI request failed (${response.status})`;
    throw new Error(message);
  }
  const raw = extractResponseText(payload).trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(raw);
}

export function functionError(request: Request, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  if (message === "UNAUTHORIZED") return json(request, { error: "请先登录云端账户" }, 401);
  if (message === "OPENAI_NOT_CONFIGURED") return json(request, { error: "AI 服务尚未配置" }, 503);
  console.error(error);
  return json(request, { error: "服务暂时不可用，请稍后重试" }, 500);
}
