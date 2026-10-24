/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import ClaimsReviewList from "./claims-review-list";

export default async function ClaimsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/");
  let q = supabase.from("expense_claims")
    .select("id,claim_number,employee_id,project_id,expense_date,purpose,total_amount,status,submitted_at,profiles!expense_claims_employee_id_fkey(full_name),projects(name,site_name),expense_attachments(storage_path,original_filename),expense_items(id,description,amount,vendor_name,is_verified,verified_at,expense_categories(name))")
    .order("submitted_at", { ascending: false }).limit(200);
  if (profile.role === "employee") q = q.eq("employee_id", user.id);

  if (profile.role === "accounts") q = q.in("status", ["pending_accounts", "verified", "rejected_accounts"]);
  const { data: claims, error } = await q;
  // Sign all receipt URLs in one Storage request instead of one network
  // round-trip per claim. This avoids a long waterfall on large registers.
  const receiptPaths = (claims || [])
    .map((c: any) => c.expense_attachments?.[0]?.storage_path)
    .filter((path: string | undefined): path is string => Boolean(path));
  const signedResult = receiptPaths.length
    ? await supabase.storage.from("expense-receipts").createSignedUrls(receiptPaths, 600)
    : { data: [], error: null };
  const signedByPath = new Map(
    (signedResult.data || []).map((item: any) => [item.path, item.signedUrl])
  );
  const rows = (claims || []).map((c: any) => {
    const path = c.expense_attachments?.[0]?.storage_path;
    return { ...c, receiptUrl: path ? signedByPath.get(path) || null : null };
  });
  return <main className="content standalone-content">
    <div className="section-heading page-heading"><div><p className="eyebrow">FINANCE OPERATIONS</p><h2>Expense entries</h2><p>{profile.role === "accounts" ? "Verify each expense line in one consolidated register." : profile.role === "project_manager" ? "Review expense entries and approve the full submission in one action." : "Expense entries visible to your role and project access."}</p></div><Link className="text-link" href="/">← Dashboard</Link></div>
    {error && <p className="error">{error.message}</p>}
    <ClaimsReviewList claims={rows} role={profile.role} />
  </main>;
}