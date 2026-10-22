"use client";
import {useState} from "react";
type Option={id:string;full_name?:string;employee_code?:string;name?:string;site_name?:string};
export default function ExpenseExport({employees,projects,role}:{employees:Option[];projects:Option[];role:string}){
 const now=new Date(),[mode,setMode]=useState<"month"|"range">("month"),[month,setMonth]=useState(String(now.getMonth()+1).padStart(2,"0")),[year,setYear]=useState(String(now.getFullYear())),[from,setFrom]=useState(now.toISOString().slice(0,10)),[to,setTo]=useState(now.toISOString().slice(0,10)),[employee,setEmployee]=useState(""),[project,setProject]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function download(){setBusy(true);setError("");try{const start=mode==="month"?year+"-"+month+"-01":from;const end=mode==="month"?new Date(Number(year),Number(month),0).toISOString().slice(0,10):to;if(start>end)throw new Error("From date must not be after To date.");const q=new URLSearchParams({from:start,to:end});if(employee)q.set("employee",employee);if(project)q.set("project",project);const response=await fetch("/api/reports/expenses?"+q.toString());if(!response.ok){const data=await response.json();throw new Error(data.error||"Report download failed.");}const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="expense-report-"+start+"-to-"+end+".csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}catch(e){setError(e instanceof Error?e.message:"Unable to download report.");}finally{setBusy(false);}}
 return <section className="report-export-card">
  <div className="report-export-heading"><div><p className="eyebrow">{role==="accounts"?"ACCOUNTS REPORTING":"ADMIN REPORTING"}</p><h2>Download site-wise expense report</h2><p>Choose a monthly period or custom date range, then select a site/project.</p></div></div>
  <div className="report-period-switch" role="group" aria-label="Report period">
   <button type="button" className={mode==="month"?"active":""} aria-pressed={mode==="month"} onClick={()=>setMode("month")}>Monthly</button>
   <button type="button" className={mode==="range"?"active":""} aria-pressed={mode==="range"} onClick={()=>setMode("range")}>Date range</button>
  </div>
  {mode==="month"?<div className="report-filter-grid report-month-grid">
   <label className="report-field"><span>Month</span><select value={month} onChange={e=>setMonth(e.target.value)}>{Array.from({length:12},(_,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{new Date(2000,i,1).toLocaleString("en-IN",{month:"long"})}</option>)}</select></label>
   <label className="report-field"><span>Year</span><select value={year} onChange={e=>setYear(e.target.value)}>{Array.from({length:8},(_,i)=>{const y=now.getFullYear()-i;return <option key={y}>{y}</option>})}</select></label>
  </div>:<div className="report-filter-grid">
   <label className="report-field"><span>From date</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
   <label className="report-field"><span>To date</span><input type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}/></label>
  </div>}
  <div className="report-filter-grid report-scope-grid">
   {role==="admin"&&<label className="report-field"><span>Employee</span><select value={employee} onChange={e=>setEmployee(e.target.value)}><option value="">All employees</option>{employees.map(p=><option key={p.id} value={p.id}>{p.full_name}{p.employee_code?" · "+p.employee_code:""}</option>)}</select></label>}
   <label className="report-field"><span>Site / Project</span><select value={project} onChange={e=>setProject(e.target.value)}><option value="">All sites</option>{projects.map(p=><option key={p.id} value={p.id}>{p.site_name||p.name}</option>)}</select></label>
  </div>
  <div className="report-export-actions"><button type="button" className="report-download-button" onClick={download} disabled={busy}><span aria-hidden="true">↓</span>{busy?"Preparing report…":"Download CSV report"}</button><p>Includes expense and line-item details, employee/site filters, amounts and workflow status. Open the CSV in Excel.</p></div>
  {error&&<p role="alert" className="report-export-error">{error}</p>}
 </section>;
}
