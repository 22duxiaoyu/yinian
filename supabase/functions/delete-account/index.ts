import { createClient } from "npm:@supabase/supabase-js@2";
import { authenticatedClient, corsHeaders, functionError, json } from "../_shared/runtime.ts";

async function removeUserFiles(admin: ReturnType<typeof createClient>, bucket: string, userId: string) {
  const { data, error } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
  if (error) throw error;
  const paths = (data || []).filter((item) => item.id).map((item) => `${userId}/${item.name}`);
  if (!paths.length) return;
  const { error: removeError } = await admin.storage.from(bucket).remove(paths);
  if (removeError) throw removeError;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);

  try {
    const { user } = await authenticatedClient(request);
    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRoleKey) throw new Error("DELETE_ACCOUNT_NOT_CONFIGURED");
    const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    await Promise.all([
      removeUserFiles(admin, "action-documents", user.id),
      removeUserFiles(admin, "action-avatars", user.id),
    ]);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return json(request, { deleted: true });
  } catch (error) {
    return functionError(request, error);
  }
});
