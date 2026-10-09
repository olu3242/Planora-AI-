import { withTenantPage } from "@/lib/tenant-request";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { getChartOfAccounts } from "@/application/accounting/chart-of-accounts-service";
import { CoaMappingEditor } from "@/components/coa-mapping-editor";

async function ChartOfAccountsPage(){
 const session=await requirePageSession();
 if(!hasPermission(session.membership.role,"financial.read")) return <section className="panel"><h1 className="page-heading">Chart of accounts unavailable</h1></section>;
 const accounts=await getChartOfAccounts(session.organization.id); const unmapped=accounts.filter(a=>!a.mappingComplete); const canManage=hasPermission(session.membership.role,"accounting.coa.manage");
 return <>
  <div className="page-title-row"><div><h1 className="page-heading">Chart of Accounts</h1><p className="subtle">Canonical accounting and reporting taxonomy for {session.organization.name}.</p></div><span className={unmapped.length?"status":"status good"}>{unmapped.length?unmapped.length+" UNMAPPED":"MAPPING COMPLETE"}</span></div>
  <section className="metrics"><div className="metric"><div className="metric-label">Active accounts</div><div className="metric-value">{accounts.length}</div></div><div className="metric"><div className="metric-label">Posting accounts</div><div className="metric-value">{accounts.filter(a=>a.isPostingAccount).length}</div></div><div className="metric"><div className="metric-label">Suspense enabled</div><div className="metric-value">{accounts.filter(a=>a.suspenseAllowed||a.systemPurpose==="SUSPENSE").length}</div></div></section>
  <section className="statement"><div className="statement-header"><div><h2>Reporting map</h2><p>COA → financial statement → cash-flow classification → system purpose</p></div></div><div className="statement-table" role="table"><div className="statement-row statement-columns"><span>Account</span><span>Reporting alignment</span></div>{accounts.map(a=><div className="statement-row" key={a.id}><span><strong>{a.code} · {a.name}</strong><small>{a.type} · {a.normalBalance} · {a.isPostingAccount?"POSTING":"ROLLUP"}</small></span><span>{a.mappingComplete?<CheckCircle2 size={16}/>:<AlertTriangle size={16}/>} <strong>{a.reportingCode??"UNMAPPED"}</strong><small>{a.statementClass??"No statement"} · {a.statementSection??"No section"} · {a.cashFlowClass??"No cash-flow class"} · {a.systemPurpose}</small></span>{canManage&&<CoaMappingEditor account={a}/>}</div>)}</div></section>
 </>;
}

export default withTenantPage(ChartOfAccountsPage);
