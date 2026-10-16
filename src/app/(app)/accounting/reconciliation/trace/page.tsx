import { withTenantPage } from '@/lib/tenant-request';
import { requirePageSession } from '@/auth/session';
import { hasPermission } from '@/permissions/permissions';
import { getReconciliationJournalTrace } from '@/application/accounting/reconciliation-journal-trace';
import { canPreviewBankReconciliation } from '@/domain/accounting/reconciliation-preview-access';
import Link from 'next/link';
import { reconciliationEvidencePath } from '@/domain/accounting/reconciliation-lineage';

async function ReconciliationTracePage({ searchParams }: { searchParams: Promise<{ bankTransactionId?: string }> }) {
  const session = await requirePageSession();
  if (!hasPermission(session.membership.role, 'financial.read') ||
      !canPreviewBankReconciliation(session.membership.role, session.membership.active)) {
    return <section role="alert">Reconciliation evidence unavailable</section>;
  }
  const id = (await searchParams).bankTransactionId;
  if (!id) return <section role="alert">Select a valid bank transaction.</section>;
  try { reconciliationEvidencePath(id); } catch { return <section role="alert">Select a valid bank transaction.</section>; }
  const trace = await getReconciliationJournalTrace(session.organization.id, id);
  if (!trace) return <section role="status">No finalized reconciliation evidence found.</section>;
  return <main>
    <h1>Reconciliation evidence</h1>
    <p>Canonical posted journal lineage, read-only.</p>
    <dl>
      <dt>Bank transaction</dt><dd>{trace.bankTransactionId}</dd>
      <dt>Journal</dt><dd>{trace.journalId}</dd>
      <dt>Legal entity</dt><dd>{trace.legalEntityId}</dd>
      <dt>Fiscal period</dt><dd>{trace.fiscalPeriodId}</dd>
      <dt>Cash account</dt><dd>{trace.cashAccountId}</dd>
      <dt>Cash movement</dt><dd>{trace.currencyCode} {trace.amountMinor} minor units</dd>
    </dl>
    <Link href="/accounting/reconciliation">Back to reconciliation</Link>
  </main>;
}
export default withTenantPage(ReconciliationTracePage);
