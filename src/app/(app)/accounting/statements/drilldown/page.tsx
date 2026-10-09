import { withTenantPage } from "@/lib/tenant-request";
import Link from "next/link";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { getStatementAccountDrilldown } from "@/application/accounting/statement-drilldown";

type Search=Promise<{entity?:string;period?:string;account?:string}>;
const money=(v:bigint,c:string)=>{const a=v<0n?-v:v;return (v<0n?"-":"")+c+" "+(a/100n).toLocaleString()+"."+(a%100n).toString().padStart(2,"0")};
async function StatementDrilldown({searchParams}:{searchParams:Search}){
 const session=await requirePageSession();if(!hasPermission(session.membership.role,"financial.read")) return <section className="panel"><h1>Drilldown unavailable</h1></section>;
 const q=await searchParams;if(!q.entity||!q.period||!q.account)return <section className="empty-state"><h1>Statement lineage requires entity, period and account.</h1></section>;
 const data=await getStatementAccountDrilldown(session.organization.id,{legalEntityId:q.entity,fiscalPeriodId:q.period,accountId:q.account});
 const currency=data.lines[0]?.journal.currencyCode??"USD";
 return <><div className="page-title-row"><div><h1 className="page-heading">{data.account.code} · {data.account.name}</h1><p className="subtle">{data.account.statementClass} · {data.account.statementSection} · {data.account.reportingCode} · {data.account.cashFlowClass}</p></div><span className="status good">LEDGER LINEAGE</span></div>
 <section className="metrics"><div className="metric"><div className="metric-label">Debit</div><div className="metric-value">{money(data.totalDebitMinor,currency)}</div></div><div className="metric"><div className="metric-label">Credit</div><div className="metric-value">{money(data.totalCreditMinor,currency)}</div></div><div className="metric"><div className="metric-label">Journal lines</div><div className="metric-value">{data.lines.length}</div></div></section>
 <section className="statement"><div className="statement-header"><h2>Source journals</h2></div><div className="statement-table">{data.lines.map(l=><div className="statement-row" key={l.id}><span><strong>{l.journal.sourceKey}</strong><small>{l.journal.description??"No description"} · {l.journal.postedAt?.toISOString()??"Not posted"}{l.journal.reversalOfId?" · REVERSAL":""}</small></span><strong>{l.debitMinor>0n?"Dr "+money(l.debitMinor,currency):"Cr "+money(l.creditMinor,currency)}</strong></div>)}</div></section>
 <Link className="button button-secondary" href={"/accounting/statements?entity="+q.entity+"&period="+q.period}>Back to statements</Link></>;
}

export default withTenantPage(StatementDrilldown);
