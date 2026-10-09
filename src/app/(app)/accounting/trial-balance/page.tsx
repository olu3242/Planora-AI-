import Link from "next/link";
import { Scale } from "lucide-react";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { getLedgerWorkspace } from "@/application/accounting/ledger-workspace";
import { getTrialBalance } from "@/application/accounting/trial-balance-service";

type Search=Promise<{entity?:string;period?:string}>;
const money=(v:bigint,c:string)=>new Intl.NumberFormat("en-US",{style:"currency",currency:c}).format(Number(v)/100);

export default async function TrialBalancePage({searchParams}:{searchParams:Search}){
 const session=await requirePageSession();
 if(!hasPermission(session.membership.role,"financial.read")) return <section className="panel" role="alert"><h1 className="page-heading">Trial balance unavailable</h1></section>;
 const q=await searchParams;
 const meta=await getLedgerWorkspace(session.organization.id,{legalEntityId:q.entity,fiscalPeriodId:q.period});
 const tb=await getTrialBalance(session.organization.id,{legalEntityId:q.entity,fiscalPeriodId:q.period});
 return <>
  <div className="page-title-row"><div><h1 className="page-heading">Trial balance</h1><p className="subtle">Posted ledger balances · exact minor-unit arithmetic</p></div><span className="status good"><Scale size={14}/> BALANCED</span></div>
  <form className="filter-bar" method="get">
   <label className="compact-field">Entity<select name="entity" defaultValue={q.entity??""}><option value="">All entities</option>{meta.entities.map(e=><option key={e.id} value={e.id}>{e.code} · {e.name}</option>)}</select></label>
   <label className="compact-field">Period<select name="period" defaultValue={q.period??""}><option value="">All periods</option>{meta.periods.map(p=><option key={p.id} value={p.id}>{p.year.code} · {p.name}</option>)}</select></label>
   <button className="button button-secondary">Apply</button><Link className="button button-secondary" href="/accounting">Journal register</Link>
  </form>
  <section className="statement"><div className="statement-header"><div><h2>Trial balance</h2><p>{tb.currencyCode} · posted journals only</p></div></div><div className="statement-table" role="table"><div className="statement-row statement-columns" role="row"><span role="columnheader">Account</span><span role="columnheader">Debit / Credit</span></div>
   {tb.rows.map(row=><div className="statement-row" role="row" key={row.accountId}><span><strong>{row.account.code} · {row.account.name}</strong><small>{row.account.type}</small></span><strong>{row.debitMinor>0n?money(row.debitMinor,tb.currencyCode):"("+money(row.creditMinor,tb.currencyCode)+")"}</strong></div>)}
   <div className="statement-row statement-total"><span>Total</span><strong>{money(tb.debitMinor,tb.currencyCode)} = {money(tb.creditMinor,tb.currencyCode)}</strong></div></div></section>
 </>;
}
