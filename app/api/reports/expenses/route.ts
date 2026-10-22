import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
const csv=(v:unknown)=>{const s=String(v??"");return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
export async function GET(request:NextRequest){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorised"},{status:401});
  const {data:profile}=await supabase.from("profiles").select("role,is_active").eq("id",user.id).maybeSingle();
  if(!["admin","accounts"].includes(profile?.role||"")||!profile?.is_active)return NextResponse.json({error:"Accounts or Admin access required"},{status:403});
  const params=request.nextUrl.searchParams;
  const from=params.get("from"),to=params.get("to"),employee=params.get("employee")||"",project=params.get("project")||"";
  if(!from||!to||!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to)return NextResponse.json({error:"Select a valid date range."},{status:400});
  let query=supabase.from("expense_claims").select("id,claim_number,employee_id,project_id,expense_date,purpose,total_amount,status,submitted_at").gte("expense_date",from).lte("expense_date",to).order("expense_date",{ascending:true});
  if(employee)query=query.eq("employee_id",employee);
  if(project)query=query.eq("project_id",project);
  const {data:claims,error}=await query;
  if(error)return NextResponse.json({error:error.message},{status:500});
  const rows=claims||[];
  const ids=rows.map(c=>c.id),employeeIds=[...new Set(rows.map(c=>c.employee_id))],projectIds=[...new Set(rows.map(c=>c.project_id))];
  const [peopleResult,projectsResult,itemsResult]=await Promise.all([
    employeeIds.length?supabase.from("profiles").select("id,full_name,employee_code").in("id",employeeIds):Promise.resolve({data:[],error:null}),
    projectIds.length?supabase.from("projects").select("id,name,site_name").in("id",projectIds):Promise.resolve({data:[],error:null}),
    ids.length?supabase.from("expense_items").select("claim_id,description,amount,vendor_name,category_id").in("claim_id",ids):Promise.resolve({data:[],error:null})
  ]);
  if(peopleResult.error||projectsResult.error||itemsResult.error)return NextResponse.json({error:"Unable to load report details."},{status:500});
  const categoryIds=[...new Set((itemsResult.data||[]).map(i=>i.category_id).filter(Boolean))];
  const categoryResult=categoryIds.length?await supabase.from("expense_categories").select("id,name").in("id",categoryIds):{data:[],error:null};
  if(categoryResult.error)return NextResponse.json({error:"Unable to load categories."},{status:500});
  const people=new Map((peopleResult.data||[]).map(p=>[p.id,p])),projects=new Map((projectsResult.data||[]).map(p=>[p.id,p])),categories=new Map((categoryResult.data||[]).map(c=>[c.id,c.name]));
  const itemsByClaim=new Map<string,any[]>();
  for(const item of itemsResult.data||[]){const list=itemsByClaim.get(item.claim_id)||[];list.push(item);itemsByClaim.set(item.claim_id,list);}
  const header=["Expense Date","Claim No.","Employee","Employee Code","Site / Project","Category","Description","Vendor","Line Amount (INR)","Claim Total (INR)","Status","Purpose","Submitted At"];
  const output=[header,...rows.flatMap(c=>{const p=people.get(c.employee_id),site=projects.get(c.project_id),items=itemsByClaim.get(c.id)||[];return (items.length?items:[null]).map(i=>[c.expense_date,c.claim_number,p?.full_name,p?.employee_code,site?.site_name||site?.name,i?.category_id?categories.get(i.category_id):"",i?.description||"",i?.vendor_name||"",i?.amount??"",c.total_amount,c.status,c.purpose,c.submitted_at]);})];
  const body="\uFEFF"+output.map(row=>row.map(csv).join(",")).join("\r\n");
  return new NextResponse(body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="expense-report-'+from+'-to-'+to+'.csv"',"Cache-Control":"no-store"}});
}
