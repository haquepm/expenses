"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ExpenseItem = { id:string; description:string; amount:number; vendor_name?:string|null; is_verified:boolean; verified_at?:string|null; expense_categories?:{name:string}|null };
type Claim = { id:string; claim_number:number; employee_id:string; expense_date:string; purpose:string; total_amount:number; status:string; profiles?:{full_name:string}|null; projects?:{name:string;site_name?:string|null}|null; receiptUrl?:string|null; expense_items?:ExpenseItem[] };
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n||0);
export default function ClaimsReviewList({expense entries,role}:{expense entries:Claim[];role:string}) {
  const router=useRouter();
  const [busy,setBusy]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  async function pmDecision(claim:Claim,decision:"approved"|"rejected") {
    const remarks=window.prompt(decision==="approved"?"Optional approval remarks":"Please enter remarks (required for rejection)");
    if(remarks===null || (decision==="rejected"&&!remarks.trim())) return;
    setBusy(claim.id);setMessage("");
    try { const result=await createClient().rpc("decide_expense_claim",{p_claim_id:claim.id,p_decision:decision,p_remarks:remarks||null}); if(result.error) throw result.error; router.refresh(); }
    catch(e){setMessage(e instanceof Error?e.message:"Unable to save PM decision.");}
    finally{setBusy(null);}
  }
  async function approveAll() {
    if (!window.confirm("Approve all expense entries currently awaiting PM approval for your assigned projects?")) return;
    setBusy("all"); setMessage("");
    try {
      const result = await createClient().rpc("approve_all_pm_expense entries");
      if (result.error) throw result.error;
      const count = Number(result.data || 0);
      setMessage(count ? count + " expense submission(s) approved and sent to Accounts." : "There are no expense entries awaiting PM approval.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to approve expense entries.");
    } finally {
      setBusy(null);
    }
  }
  async function verifyLine(item:ExpenseItem) {
    setBusy(item.id);setMessage("");
    try { const result=await createClient().rpc("verify_expense_item",{p_item_id:item.id,p_verified:true,p_remarks:null}); if(result.error) throw result.error; router.refresh(); }
    catch(e){setMessage(e instanceof Error?e.message:"Unable to verify expense line.");}
    finally{setBusy(null);}
  }
  if(!expense entries.length) return <div className="empty-card"><b>No expense entries found</b><p>New submitted expenses will appear here.</p></div>;
  if(role==="accounts") return <div className="expense entries-register">
    <div className="register-summary"><b>{expense entries.reduce((n,c)=>n+(c.expense_items?.length||0),0)} expense lines</b><span>{expense entries.length} expense entries · Accounts expense verification register</span></div>
    <div className="table-card table-scroll"><table className="expense entries-table"><thead><tr><th>Claim / Date</th><th>Employee</th><th>Site / Project</th><th>Expense item</th><th>Vendor</th><th>Amount</th><th>Proof</th><th>Verification</th></tr></thead><tbody>
    {expense entries.flatMap(c=>(c.expense_items||[]).map(item=><tr key={item.id}><td><b>EX-{String(c.claim_number).padStart(5,"0")}</b><small>{new Date(c.expense_date+"T00:00:00").toLocaleDateString("en-IN")}</small></td><td>{c.profiles?.full_name||"Employee"}</td><td>{c.projects?.name||"Project"}{c.projects?.site_name?" / "+c.projects.site_name:""}</td><td><b>{item.description}</b><small>{item.expense_categories?.name||"Uncategorised"}{c.purpose?" · "+c.purpose:""}</small></td><td>{item.vendor_name||"—"}</td><td className="amount">{money(Number(item.amount))}</td><td>{c.receiptUrl?<a className="receipt-link" href={c.receiptUrl} target="_blank" rel="noreferrer">↗ View proof</a>:"—"}</td><td>{item.is_verified||c.status==="verified"?<span className="line-verified">✓ Verified</span>:c.status==="pending_accounts"?<button className="verify-toggle" disabled={busy===item.id} onClick={()=>verifyLine(item)}>{busy===item.id?"Saving…":"Verify"}</button>:<span className={"status status-"+c.status}>{c.status.replaceAll("_"," ")}</span>}</td></tr>))}
    </tbody></table></div>{message&&<p className="error">{message}</p>}
    <p className="register-note">A claim moves to Verified automatically only after every expense line in that claim has been verified.</p>
  </div>;
  if(role==="project_manager") {
    const pendingCount=expense entries.filter(c=>c.status==="pending_pm").length;
    const statusLabel=(status:string)=>({
      pending_pm:"PM Approval Pending",
      pending_accounts:"Accounts Verification Pending",
      verified:"Verified",
      rejected_pm:"Rejected by PM",
      rejected_accounts:"Returned by Accounts"
    }[status]||status.replaceAll("_"," "));
    return <div className="expense entries-register">
      <div className="register-summary"><b>{expense entries.length} expense entries</b><span>{pendingCount} awaiting PM approval · Assigned projects only</span></div>
      {pendingCount>0&&<div className="bulk-approval-bar"><span>Approve all {pendingCount} pending claim(s)</span><button className="bulk-approve-button" disabled={busy!==null} onClick={approveAll}>{busy==="all"?"Approving…":"Approve All Claims"}</button></div>}
      <div className="table-card table-scroll"><table className="expense entries-table"><thead><tr><th>Claim</th><th>Employee</th><th>Site / Project</th><th>Expense date</th><th>Purpose</th><th>Claim total</th><th>Proof</th><th>Approval / Verification status</th></tr></thead><tbody>
      {expense entries.map(c=><tr key={c.id}><td><b>EX-{String(c.claim_number).padStart(5,"0")}</b><small>{c.expense_items?.length||0} line items</small></td><td>{c.profiles?.full_name||"Employee"}</td><td>{c.projects?.name||"Project"}{c.projects?.site_name?" / "+c.projects.site_name:""}</td><td>{new Date(c.expense_date+"T00:00:00").toLocaleDateString("en-IN")}</td><td>{c.purpose}</td><td className="amount">{money(Number(c.total_amount))}</td><td>{c.receiptUrl?<a className="receipt-link" href={c.receiptUrl} target="_blank" rel="noreferrer">↗ View proof</a>:"—"}</td><td><span className={"claim-status status-"+c.status}>{statusLabel(c.status)}</span></td></tr>)}
      </tbody></table></div>{message&&<p className="bulk-approval-message">{message}</p>}
    </div>;
  }
  return <div className="expense entries-list">{expense entries.map(c=><article className="claim-card" key={c.id}><div className="claim-top"><div><span className="claim-number">EX-{String(c.claim_number).padStart(5,"0")}</span><h3>{c.purpose}</h3><p>{c.profiles?.full_name||"Employee"} · {c.projects?.name||"Project"} · {new Date(c.expense_date+"T00:00:00").toLocaleDateString("en-IN")}</p></div><strong>{money(Number(c.total_amount))}</strong></div></article>)}</div>;
}
