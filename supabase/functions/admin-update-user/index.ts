import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Sign in required" }, 401);

  const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await caller.auth.getUser();
  if (authError || !user) return json({ error: "Invalid session" }, 401);

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: actor } = await admin.from("profiles").select("role,is_active").eq("id", user.id).maybeSingle();
  if (!actor || actor.role !== "admin" || !actor.is_active) return json({ error: "Administrator access required" }, 403);

  try {
    const body = await req.json();
    const userId = String(body.user_id ?? "");
    const fullName = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const employeeCode = String(body.employee_code ?? "").trim() || null;
    const phone = String(body.phone ?? "").trim() || null;
    const role = String(body.role ?? "");
    const isActive = body.is_active === true;
    const projectIds = Array.isArray(body.project_ids) ? [...new Set(body.project_ids.map((x: unknown) => String(x)))] : [];

    if (!userId || !fullName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid name and email address.");
    if (!["employee", "project_manager", "accounts", "management", "admin"].includes(role)) throw new Error("Invalid role.");
    if (userId === user.id && (!isActive || role !== "admin")) throw new Error("You cannot deactivate or remove your own administrator access.");
    if (projectIds.length && !["employee", "project_manager"].includes(role)) throw new Error("Only employees and Project Managers can be assigned to projects.");
    if (projectIds.length) {
      const { data: validProjects, error } = await admin.from("projects").select("id").in("id", projectIds).eq("is_active", true);
      if (error || !validProjects || validProjects.length !== projectIds.length) throw new Error("One or more selected projects are invalid or inactive.");
    }

    const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError || !target.user) throw new Error("Employee account was not found.");
    const previousEmail = target.user.email ?? "";
    if (email !== previousEmail) {
      const { error } = await admin.auth.admin.updateUserById(userId, { email, email_confirm: true });
      if (error) throw new Error("Could not update login email: " + error.message);
    }

    const { error: profileError } = await admin.from("profiles").update({
      full_name: fullName, email, employee_code: employeeCode, phone, role, is_active: isActive, updated_at: new Date().toISOString(),
    }).eq("id", userId);
    if (profileError) {
      if (email !== previousEmail) await admin.auth.admin.updateUserById(userId, { email: previousEmail, email_confirm: true });
      throw new Error("Could not update employee profile: " + profileError.message);
    }

    const { error: deleteError } = await admin.from("project_members").delete().eq("user_id", userId);
    if (deleteError) throw new Error("Profile updated, but project assignments could not be reset: " + deleteError.message);
    if (projectIds.length) {
      const accessRole = role === "project_manager" ? "project_manager" : "employee";
      const { error } = await admin.from("project_members").insert(projectIds.map((project_id: string) => ({ project_id, user_id: userId, access_role: accessRole })));
      if (error) throw new Error("Profile updated, but project assignments could not be saved: " + error.message);
    }

    await admin.from("expense_audit_logs").insert({
      actor_id: user.id, entity_type: "profile", entity_id: userId, action: "updated",
      details: { email, role, is_active: isActive, project_ids: projectIds },
    });
    return json({ user_id: userId, message: "Employee details updated." });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to update employee." }, 400);
  }
});
