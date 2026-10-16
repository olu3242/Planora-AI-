import { withTenantPage } from '@/lib/tenant-request';
import { requirePageSession } from '@/auth/session';
import { hasPermission } from '@/permissions/permissions';
import { prisma } from '@/lib/prisma';
import { previewReconciliationForTrustedActor } from '@/application/accounting/trusted-reconciliation-preview';

async function ReconciliationPage({ searchParams }: { searchParams: Promise<{ bankAccountId?: string }> }) {
  const session = await requirePageSession();
  if (!hasPermission(session.membership.role, 'financial.read')) return <section role="alert">Accounting unavailable</section>;
  const accounts = await prisma.bankAccount.findMany({
    where: { organizationId: session.organization.id, active: true },
    select: { id: true, name: true },
  });
  const selected = (await searchParams).bankAccountId;
  const account = accounts.find(item => item.id === selected);
  const authorized = ['CFO', 'FPA_DIRECTOR'].includes(session.membership.role);
  const preview = account && authorized
    ? await previewReconciliationForTrustedActor({ organizationId: session.organization.id, actorId: session.user.id }, account.id)
    : null;
  return <main>
    <h1>Bank reconciliation</h1>
    <p>Read-only matching preview. No journal or bank transaction is changed.</p>
    <form method="get">
      <label>Bank account <select name="bankAccountId" defaultValue={account?.id ?? ''}>
        <option value="">Choose account</option>
        {accounts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
      <button type="submit">Preview</button>
    </form>
    {!authorized && <p role="alert">CFO or FP&A Director authorization required.</p>}
    {preview && <section aria-label="Reconciliation results">
      <h2>Candidate matches</h2>
      <ul>{preview.results.map(item => <li key={item.bankTransactionId}>
        {item.bankTransactionId}: {item.status}
      </li>)}</ul>
      {!preview.results.length && <p>No unmatched movements.</p>}
    </section>}
  </main>;
}
export default withTenantPage(ReconciliationPage);
