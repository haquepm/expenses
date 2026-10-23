import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExpenseForm from "./expense-form";
type AssignedProject = { id: string; name: string; site_name: string | null };
type ProjectMembership = { projects: AssignedProject | null };
type ExpenseDraft = {id:string;project_id:string;expense_date:string;purpose:string;category_id:string|null;description:string;amount:number;vendor_name:string|null;receipt_storage_path?:string|null;receipt_original_filename?:string|null;receipt_content_type?:string|null};
export default async function NewExpensePage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const [{data:projects},{data:categories},{data:drafts}]=await Promise.all([
  supabase.from("project_members").select("project_id,projects(id,name,site_name)").eq("user_id",user.id).eq("access_role","employee"),
  supabase.from("expense_categories").select("id,name").eq("is_active",true).order("name"),
  supabase.from("employee_expense_drafts").select("id,project_id,expense_date,purpose,category_id,description,amount,vendor_name,receipt_storage_path,receipt_original_filename,receipt_content_type").eq("employee_id",user.id).order("created_at",{ascending:true})
 ]);
 const assigned=((projects||[]) as unknown as ProjectMembership[]).map(x=>x.projects).filter((p):p is AssignedProject=>Boolean(p));
 return <main className="form-shell"><header className="form-header"><Link href="/">← Back to dashboard</Link><span className="form-brand">CRESCENT · CRES PAY</span></header><section className="form-card"><p className="eyebrow">EMPLOYEE PORTAL</p><h1>Record expenses</h1><p className="muted">Add each expense to your saved entries. When all entries are ready, submit them together for approval.</p><ExpenseForm projects={assigned} categories={categories||[]} initialDrafts={(drafts||[]) as ExpenseDraft[]}/></section></main>;
}