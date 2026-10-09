import Link from "next/link";
import { CheckCircle2, LockKeyhole, TriangleAlert } from "lucide-react";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { getLedgerWorkspace } from "@/application/accounting/ledger-workspace";
import { validateApCloseReadiness, validateArCloseReadiness, validateBankCloseReadiness } from "@/application/accounting/close-readiness";
import { getTrialBalance } from "@/application/accounting/trial-balance-service";
import { StartCloseWorkflow } from "@/components/accounting-workflow-actions";

type Search=Promise<{entity?:string;period?:string}>;
export default async function CloseCenter({searchParams}:{searchParams:Search}){
 const session=await requirePageSession();
 if(!hasPermission(session.membership.role,"financial.read")) return <section className="panel"><h1 className="page-heading">Close Center unavailable</h1></section>;
 const q=await searchParams; const meta=await getLedgerWorkspace(session.organization.id,{legalEntityId:q.entity,fiscalPeriodId:q.period});
 const selectedPeriod=meta.periods.find(p=>p.id===q.period);
 let checks:{name:string;ok:boolean;detail:string}[]=[];
 if(q.entity&&q.period){
  const scope={organizationId:session.organization.id,legalEntityId:q.entity,fiscalPeriodId:q.period};
  const results=await Promise.allSettled([validateBankCloseReadiness(scope),validateApCloseReadiness(scope),validateArCloseReadiness(scope),getTrialBalance(session.organization.id,{legalEntityId:q.entity,fiscalPeriodId:q.period})]);
  const names=["Bank reconciliation","Accounts payable","Accounts receivable","Trial balance"];
  checks=results.map((x,i)=>({name:names[i],ok:x.status==="fulfilled",detail:x.status==="rejected"?(x.reason instanceof Error?x.reason.message:"Blocked"):"Ready"}));
 }
 const ready=checks.length===4&&checks.every(c=>c.ok)&&selectedPeriod?.accountingCloseState!=="HARD_CLOSED";
 return <>
  <div className="page-title-row"><div><h1 className="page-heading">Close Center</h1><p className="subtle">Pre-close controls before the governed close-to-forecast workflow.</p></div><span className={ready?"status good":"status"}>{ready?"READY FOR WORKFLOW":"REVIEW REQUIRED"}</span></div>
  <form className="filter-bar" method="get"><label className="compact-field">Entity<select name="entity" defaultValue={q.entity??""}><option value="">Select entity</option>{meta.entities.map(e=><option key={e.id} value={e.id}>{e.code} · {e.name}</option>)}</select></label><label className="compact-field">Period<select name="period" defaultValue={q.period??""}><option value="">Select period</option>{meta.periods.map(p=><option key={p.id} value={p.id}>{p.year.code} · {p.name} · {p.accountingCloseState}</option>)}</select></label><button className="button button-secondary">Run readiness</button></form>
  <section className="panel"><div className="section-heading"><div><h2>Close readiness</h2><p>All four controls must pass. Starting the workflow does not itself close the period.</p></div><LockKeyhole size={20}/></div><div className="fact-list">{checks.map(c=><div className="fact-row" key={c.name}><div>{c.ok?<CheckCircle2 size={18}/>:<TriangleAlert size={18}/>} <strong>{c.name}</strong></div><div><strong>{c.ok?"PASS":"BLOCKED"}</strong><span>{c.detail}</span></div></div>)}{!checks.length&&<div className="empty-state"><h2>Select an entity and period</h2></div>}</div></section>
  {ready&&q.entity&&q.period&&<section className="panel"><h2>Governed close workflow</h2><p className="subtle">Start the durable workflow. It must reach a separate controller approval before the period-close step can execute.</p><StartCloseWorkflow legalEntityId={q.entity} fiscalPeriodId={q.period}/></section>}
  <Link className="button button-secondary" href="/accounting/control-center">Open Control Center</Link>
 </>;
}
