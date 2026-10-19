import Link from "next/link";
import { withTenantPage } from "@/lib/tenant-request";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { getBookkeepingCleanupReviewState } from "@/application/accounting/bookkeeping-cleanup-review-state";
import { CleanupDecisionForm } from "@/components/bookkeeping-cleanup-decision-form";
async function CleanupExecutionPage({ params }: { params: Promise<{ executionId: string }> }) {
  const session = await requirePageSession();
  if (!hasPermission(session.membership.role, "accounting.recommendation.review"))
    return <section className="panel" role="alert"><h1>403 — Cleanup review unavailable</h1></section>;
  const { executionId } = await params;
  const run = await getBookkeepingCleanupReviewState({ organizationId: session.organization.id, role: session.membership.role }, executionId);
  return <><Link href="/bookkeeping-cleanup">Back to review queue</Link>
    <h1 className="page-heading">Cleanup batch {run.batchId}</h1>
    <p className="subtle">{run.findings.length} findings · No accounting changes are applied by reviewing.</p>
    <section className="panel" aria-label="Cleanup findings">
      {run.findings.length ? run.findings.map((finding, index) => <article key={`${finding.transactionId}:${finding.kind}:${index}`}>
        <h2>{finding.kind.replaceAll("_", " ")}</h2>
        <p>Transaction: {finding.transactionId}</p>
        {finding.relatedTransactionId && <p>Possible match: {finding.relatedTransactionId}</p>}
        <p>{finding.reason}</p><p>Review: {finding.review.status}</p>
        {finding.review.status === "PENDING" && <CleanupDecisionForm executionId={run.executionId} transactionId={finding.transactionId} kind={finding.kind} />}
      </article>) : <p>No findings in this batch.</p>}
    </section></>;
}
export default withTenantPage(CleanupExecutionPage);
