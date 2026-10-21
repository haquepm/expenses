import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Sign in required" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await caller.auth.getUser();
  if (authError || !user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: actor } = await admin.from("profiles").select("role,is_active").eq("id", user.id).maybeSingle();
  if (!actor || actor.role !== "admin" || !actor.is_active) return new Response(JSON.stringify({ error: "Administrator access required" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const body = await req.json(); const email = String(body.email ?? "").trim().toLowerCase(); const full_name = String(body.full_name ?? "").trim();
    const employee_code = String(body.employee_code ?? "").trim() || null; const phone = String(body.phone ?? "").trim() || null; const role = String(body.role ?? "employee");
    const project_ids = Array.isArray(body.project_ids) ? [...new Set(body.project_ids.map((x: unknown) => String(x)))] : [];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !full_name) throw new Error("Enter a valid email and full name.");
    if (!["employee","project_manager","accounts","management","admin"].includes(role)) throw new Error("Invalid role.");
    if (project_ids.length && !["employee","project_manager"].includes(role)) throw new Error("Only employees and Project Managers receive project assignments.");
    if (project_ids.length) { const { data: validProjects } = await admin.from("projects").select("id").in("id", project_ids).eq("is_active", true); if (!validProjects || validProjects.length !== project_ids.length) throw new Error("One or more selected projects are invalid or inactive."); }
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name } });
    if (inviteError || !invited.user) throw new Error(inviteError?.message ?? "Invitation failed.");
    const { error: profileError } = await admin.from("profiles").insert({ id: invited.user.id, full_name, email, employee_code, phone, role, is_active: true });
    if (profileError) { await admin.auth.admin.deleteUser(invited.user.id); throw new Error(profileError.message); }
    if (project_ids.length) { const access_role = role === "project_manager" ? "project_manager" : "employee"; const { error: assignmentError } = await admin.from("project_members").insert(project_ids.map((project_id: string) => ({ project_id, user_id: invited.user!.id, access_role }))); if (assignmentError) { await admin.from("profiles").delete().eq("id", invited.user.id); await admin.auth.admin.deleteUser(invited.user.id); throw new Error(assignmentError.message); } }
    await admin.from("expense_audit_logs").insert({ actor_id: user.id, entity_type: "profile", entity_id: invited.user.id, action: "invited", details: { email, role, project_ids } });
    return new Response(JSON.stringify({ user_id: invited.user.id, email, message: "Invitation sent." }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) { return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unable to create user." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } }); }
});