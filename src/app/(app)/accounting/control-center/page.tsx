import Link from "next/link";
import { Activity, CheckCircle2, Clock3, TriangleAlert } from "lucide-react";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { getApprovalInbox, getWorkflowOperations } from "@/lib/orchestration/operations";

export default async function AccountingControlCenter(){
 const session=await requirePageSession();
 if(!hasPermission(session.membership.role,"financial.read")) return <section className="panel" role="alert"><h1 className="page-heading">Control Center unavailable</h1></section>;
 const [ops,approvals]=await Promise.all([getWorkflowOperations(session.organization.id),getApprovalInbox(session.organization.id,session.user.id)]);
 return <>
  <div className="page-title-row"><div><h1 className="page-heading">Accounting Control Center</h1><p className="subtle">Workflow operations, approvals, failures, and financial-control evidence.</p></div><span className={ops.attention?"status":"status good"}>{ops.attention?"ATTENTION":"HEALTHY"}</span></div>
  <section className="metrics"><div className="metric"><div className="metric-label">Recent workflows</div><div className="metric-value">{ops.runs.length}</div></div><div className="metric"><div className="metric-label">Needs attention</div><div className="metric-value">{ops.attention}</div></div><div className="metric"><div className="metric-label">My approvals</div><div className="metric-value">{approvals.length}</div></div></section>
  <section className="panel"><div className="section-heading"><div><h2>Approval inbox</h2><p>Requester and approver are separated. Approval still requires the governed API permission check.</p></div><Clock3 size={20}/></div>
   <div className="fact-list">{approvals.map(a=><div className="fact-row" key={a.id}><div><strong>{a.definitionId}</strong><span>{a.id}</span></div><div><strong>{a.status}</strong><span>{a.updatedAt.toISOString()}</span></div></div>)}{!approvals.length&&<div className="empty-state"><CheckCircle2 size={24}/><h2>No approvals waiting</h2></div>}</div>
  </section>
  <section className="panel"><div className="section-heading"><div><h2>Workflow operations</h2><p>Latest durable runs and step execution state.</p></div><Activity size={20}/></div>
   <div className="fact-list">{ops.runs.map(run=><div className="fact-row" key={run.id}><div><strong>{run.definitionId} v{run.definitionVersion}</strong><span>{run.id}</span></div><div><strong>{run.status}</strong><span>{run.executions.filter(e=>e.status==="FAILED").length} failed step(s)</span></div></div>)}{!ops.runs.length&&<div className="empty-state"><TriangleAlert size={24}/><h2>No workflow runs yet</h2></div>}</div>
  </section>
  <Link className="button button-secondary" href="/accounting">Back to general ledger</Link>
 </>;
}
