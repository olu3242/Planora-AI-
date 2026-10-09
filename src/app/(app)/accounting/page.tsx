import Link from "next/link";
import { Activity, BookOpen, LockKeyhole, Scale } from "lucide-react";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { getLedgerWorkspace } from "@/application/accounting/ledger-workspace";

type Search=Promise<{entity?:string;period?:string}>;
const money=(v:bigint,currency:string)=>new Intl.NumberFormat("en-US",{style:"currency",currency}).format(Number(v)/100);

export default async function AccountingPage({searchParams}:{searchParams:Search}){
 const session=await requirePageSession();
 if(!hasPermission(session.membership.role,"financial.read")) return <section className="panel" role="alert"><h1 className="page-heading">Accounting unavailable</h1></section>;
 const q=await searchParams;
 const data=await getLedgerWorkspace(session.organization.id,{legalEntityId:q.entity,fiscalPeriodId:q.period});
 const selectedPeriod=data.periods.find(p=>p.id===q.period);
 return <>
  <div className="page-title-row"><div><h1 className="page-heading">General ledger</h1><p className="subtle">Governed posted journals for {session.organization.name}</p></div><span className="status good">TENANT SCOPED</span></div>
  <form className="filter-bar" method="get" aria-label="Ledger filters">
   <label className="compact-field">Entity<select name="entity" defaultValue={q.entity??""}><option value="">All entities</option>{data.entities.map(e=><option key={e.id} value={e.id}>{e.code} · {e.name}</option>)}</select></label>
   <label className="compact-field">Period<select name="period" defaultValue={q.period??""}><option value="">All periods</option>{data.periods.map(p=><option key={p.id} value={p.id}>{p.year.code} · {p.name} · {p.accountingCloseState}</option>)}</select></label>
   <button className="button button-secondary" type="submit">Apply</button><Link className="button button-secondary" href="/accounting/trial-balance"><Scale size={14}/> Trial balance</Link><Link className="button button-secondary" href="/accounting/control-center"><Activity size={14}/> Control Center</Link>
  </form>
  {selectedPeriod&&<section className="panel"><div className="page-title-row"><div><strong>{selectedPeriod.year.code} · {selectedPeriod.name}</strong><p className="subtle">Posting state</p></div><span className={selectedPeriod.accountingCloseState==="OPEN"?"status good":"status"}><LockKeyhole size={14}/> {selectedPeriod.accountingCloseState}</span></div></section>}
  <section className="statement" aria-labelledby="ledger-heading"><div className="statement-header"><div><h2 id="ledger-heading">Journal register</h2><p>Latest 50 journals · posted evidence only</p></div><BookOpen size={20}/></div>
   <div className="statement-table" role="table" aria-label="Journal register"><div className="statement-row statement-columns" role="row"><span role="columnheader">Journal</span><span role="columnheader">Amount</span></div>
   {data.journals.map(j=><div className="statement-row" role="row" key={j.id}><span role="cell"><strong>{j.sourceKey}</strong><small>{j.legalEntity.code} · {j.fiscalPeriod.name} · {j.description??"No description"}</small></span><strong role="cell">{money(j.debitMinor,j.currencyCode)}</strong></div>)}
   {!data.journals.length&&<div className="empty-state"><BookOpen size={24}/><h2>No journals in scope</h2><p className="subtle">Select another entity or period, or post a governed journal through the certified posting workflow.</p></div>}</div>
  </section>
 </>;
}
