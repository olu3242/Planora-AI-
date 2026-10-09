import Link from "next/link";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { getLedgerWorkspace } from "@/application/accounting/ledger-workspace";
import { getLedgerFinancialStatements } from "@/application/accounting/financial-statements-service";

type Search=Promise<{entity?:string;period?:string}>;
const exactMoney=(minor:bigint,currency:string|null)=>{const sign=minor<0n?"-":"";const a=minor<0n?-minor:minor;const whole=a/100n;const cents=(a%100n).toString().padStart(2,"0");return currency?sign+currency+" "+whole.toLocaleString()+"."+cents:sign+whole.toString()+"."+cents;};
const net=(a:{normalBalance:"DEBIT"|"CREDIT";debitMinor:bigint;creditMinor:bigint})=>a.normalBalance==="DEBIT"?a.debitMinor-a.creditMinor:a.creditMinor-a.debitMinor;

export default async function StatementsPage({searchParams}:{searchParams:Search}){
 const session=await requirePageSession(); if(!hasPermission(session.membership.role,"financial.read")) return <section className="panel"><h1>Statements unavailable</h1></section>;
 const q=await searchParams; const meta=await getLedgerWorkspace(session.organization.id,{legalEntityId:q.entity,fiscalPeriodId:q.period});
 const statements=q.entity&&q.period?await getLedgerFinancialStatements(session.organization.id,{legalEntityId:q.entity,fiscalPeriodId:q.period}):null;
 return <><div className="page-title-row"><div><h1 className="page-heading">Financial Statements</h1><p className="subtle">Ledger-native P&amp;L, Balance Sheet and Cash Flow aligned to the governed Chart of Accounts.</p></div>{statements&&<span className={statements.coaControl.mapped?"status good":"status"}>{statements.coaControl.mapped?"COA ALIGNED":"COA EXCEPTIONS"}</span>}</div>
 <form className="filter-bar" method="get"><label className="compact-field">Entity<select name="entity" defaultValue={q.entity??""}><option value="">Select entity</option>{meta.entities.map(e=><option key={e.id} value={e.id}>{e.code} · {e.name}</option>)}</select></label><label className="compact-field">Period<select name="period" defaultValue={q.period??""}><option value="">Select period</option>{meta.periods.map(p=><option key={p.id} value={p.id}>{p.year.code} · {p.name}</option>)}</select></label><button className="button button-secondary">Generate</button><Link className="button button-secondary" href="/accounting/chart-of-accounts">Chart of Accounts</Link></form>
 {!statements?<section className="empty-state"><h2>Select an entity and period</h2></section>:<>
 <section className="statement"><div className="statement-header"><h2>Profit &amp; Loss</h2></div><div className="statement-table">{statements.profitAndLoss.map(a=><div className="statement-row" key={a.accountId}><span><strong>{a.code} · {a.name}</strong></span><strong>{exactMoney(net(a),statements.currencyCode)}</strong></div>)}</div></section>
 <section className="statement"><div className="statement-header"><h2>Balance Sheet</h2></div><div className="statement-table">{statements.balanceSheet.map(a=><div className="statement-row" key={a.accountId}><span><strong>{a.code} · {a.name}</strong></span><strong>{exactMoney(net(a),statements.currencyCode)}</strong></div>)}</div></section>
 <section className="metrics"><div className="metric"><div className="metric-label">Operating cash flow</div><div className="metric-value">{exactMoney(statements.cashFlow.operatingMinor,statements.currencyCode)}</div></div><div className="metric"><div className="metric-label">Investing</div><div className="metric-value">{exactMoney(statements.cashFlow.investingMinor,statements.currencyCode)}</div></div><div className="metric"><div className="metric-label">Financing</div><div className="metric-value">{exactMoney(statements.cashFlow.financingMinor,statements.currencyCode)}</div></div><div className="metric"><div className="metric-label">Unclassified</div><div className="metric-value">{exactMoney(statements.cashFlow.unclassifiedMinor,statements.currencyCode)}</div></div></section>
 </>}</>;
}
