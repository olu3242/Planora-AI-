import Link from "next/link";
import { withTenantPage } from "@/lib/tenant-request";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { listBookkeepingCleanupRuns } from "@/application/accounting/bookkeeping-cleanup-review";
import { BookkeepingCleanupProposalForm } from "@/components/bookkeeping-cleanup-proposal-form";
async function BookkeepingCleanupPage() {
  const session = await requirePageSession();
  if (!hasPermission(session.membership.role, "accounting.recommendation.review") && !hasPermission(session.membership.role, "financial.import"))
    return <section className="panel" role="alert"><h1>403 — Cleanup review unavailable</h1></section>;
  const canReview = hasPermission(session.membership.role, "accounting.recommendation.review");
  const runs = canReview ? await listBookkeepingCleanupRuns({ organizationId: session.organization.id, role: session.membership.role }) : [];
  return <><h1 className="page-heading">Bookkeeping cleanup</h1>
    <p className="subtle">Review proposed anomalies. Nothing is automatically deleted or posted.</p>
    {hasPermission(session.membership.role, "financial.import") && <BookkeepingCleanupProposalForm />}
    {canReview && <section className="panel" aria-label="Cleanup review queue">
      <h2>Review queue</h2>
      {runs.length ? <ul>{runs.map(run => <li key={run.executionId}>
        <Link href={`/bookkeeping-cleanup/${run.executionId}`}>Batch {run.batchId}</Link>
        <span className="subtle"> · {run.findings.length} findings · {run.status}</span>
      </li>)}</ul> : <p className="subtle">No completed cleanup runs are available for review.</p>}
    </section></>;
}
export default withTenantPage(BookkeepingCleanupPage);
