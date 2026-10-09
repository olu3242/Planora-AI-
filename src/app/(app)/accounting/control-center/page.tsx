import { withTenantPage } from "@/lib/tenant-request";
import Link from "next/link";
import { Activity, CheckCircle2, Clock3, TriangleAlert } from "lucide-react";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { getApprovalInbox, getWorkflowOperations } from "@/lib/orchestration/operations";
import { WorkflowActions } from "@/components/accounting-workflow-actions";
import { pendingRecommendationInbox } from "@/application/agents/decision-context";
import { RecommendationDecision } from "@/components/recommendation-decision";
import { recommendationReviewPermission } from "@/application/agents/recommendation-permission";

async function AccountingControlCenter(){
 const session=await requirePageSession();
 if(!hasPermission(session.membership.role,"financial.read")) return <section className="panel" role="alert"><h1 className="page-heading">Control Center unavailable</h1></section>;
 const [ops,approvals,recommendations]=await Promise.all([getWorkflowOperations(session.organization.id),getApprovalInbox(session.organization.id,session.user.id),pendingRecommendationInbox(session.organization.id,session.user.id)]);
 return <>
  <div className="page-title-row"><div><h1 className="page-heading">Accounting Control Center</h1><p className="subtle">Workflow operations, approvals, failures, and financial-control evidence.</p></div><span className={ops.attention?"status":"status good"}>{ops.attention?"ATTENTION":"HEALTHY"}</span></div>
  <section className="metrics"><div className="metric"><div className="metric-label">Recent workflows</div><div className="metric-value">{ops.runs.length}</div></div><div className="metric"><div className="metric-label">Needs attention</div><div className="metric-value">{ops.attention}</div></div><div className="metric"><div className="metric-label">My approvals</div><div className="metric-value">{approvals.length}</div></div></section>
  <section className="panel"><div className="section-heading"><div><h2>Approval inbox</h2><p>Requester and approver are separated. Approval still requires the governed API permission check.</p></div><Clock3 size={20}/></div>
   <div className="fact-list">{approvals.map(a=><div className="fact-row" key={a.id}><div><strong>{a.definitionId}</strong><span>{a.id}</span></div><div><strong>{a.status}</strong><span>{a.updatedAt.toISOString()}</span><WorkflowActions runId={a.id} status={a.status} canApprove={hasPermission(session.membership.role,"accounting.close.approve")}/></div></div>)}{!approvals.length&&<div className="empty-state"><CheckCircle2 size={24}/><h2>No approvals waiting</h2></div>}</div>
  </section>
  <section className="panel"><div className="section-heading"><div><h2>Agent decision inbox</h2><p>Accepted or edited decisions become governed agent memory; rejected recommendations do not.</p></div></div><div className="fact-list">{recommendations.map(r=><div className="fact-row" key={r.id}><div><strong>{r.run.agentDefinition.displayName} · {r.type}</strong><span>{r.summary}</span></div><div>{hasPermission(session.membership.role,recommendationReviewPermission(r.type))&&<RecommendationDecision id={r.id}/>}</div></div>)}{!recommendations.length&&<div className="empty-state"><CheckCircle2 size={24}/><h2>No agent decisions waiting</h2></div>}</div></section>
  <section className="panel"><div className="section-heading"><div><h2>Workflow operations</h2><p>Latest durable runs and step execution state.</p></div><Activity size={20}/></div>
   <div className="fact-list">{ops.runs.map(run=><div className="fact-row" key={run.id}><div><strong>{run.definitionId} v{run.definitionVersion}</strong><span>{run.id}</span></div><div><strong>{run.status}</strong><span>{run.executions.filter(e=>e.status==="FAILED").length} failed step(s)</span><WorkflowActions runId={run.id} status={run.status} canApprove={false}/></div></div>)}{!ops.runs.length&&<div className="empty-state"><TriangleAlert size={24}/><h2>No workflow runs yet</h2></div>}</div>
  </section>
  <Link className="button button-secondary" href="/accounting">Back to general ledger</Link>
 </>;
}

export default withTenantPage(AccountingControlCenter);
