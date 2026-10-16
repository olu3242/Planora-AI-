import 'server-only';
import { prisma } from '@/lib/prisma';
import { resolveApprovedCashMapping } from './bank-cash-mapping-service';
import { selectExactCashMatch } from '@/domain/accounting/exact-cash-match';

/**
 * Read-only candidate preview. Does not mark transactions matched.
 * Tenant RLS, an approved mapping and an atomic matching command are required
 * before reconciliation can be finalized.
 */
export async function previewReconciliation(organizationId: string, bankAccountId: string) {
  const account = await prisma.bankAccount.findFirst({
    where: { id: bankAccountId, organizationId, active: true },
    select: { legalEntityId: true, currencyCode: true },
  });
  if (!account) throw new Error('BANK_ACCOUNT_NOT_FOUND');
  const transactions = await prisma.bankTransaction.findMany({
    where: { bankAccountId, status: 'UNMATCHED' },
    orderBy: [{ postedDate: 'asc' }, { id: 'asc' }],
    take: 200,
    select: { id: true, postedDate: true, amountMinor: true },
  });
  const results = [];
  for (const transaction of transactions) {
    const mapping = await resolveApprovedCashMapping(organizationId, bankAccountId, transaction.postedDate);
    if (!mapping) {
      results.push({ bankTransactionId: transaction.id, status: 'MAPPING_REQUIRED' as const });
      continue;
    }
    const lines = await prisma.accountingJournalLine.findMany({
      where: {
        accountId: mapping.cashAccountId,
        journal: {
          organizationId,
          legalEntityId: account.legalEntityId,
          currencyCode: account.currencyCode,
          status: 'POSTED',
          reversalOfId: null,
          reversedBy: null,
          matchedBankTransactions: { none: {} },
        },
      },
      select: {
        journalId: true, debitMinor: true, creditMinor: true,
      },
    });
    const net = new Map<string, bigint>();
    for (const line of lines) {
      net.set(line.journalId, (net.get(line.journalId) ?? 0n) + line.debitMinor - line.creditMinor);
    }
    const candidates = [...net.entries()].map(([journalId, amountMinor]) => ({
      journalId, amountMinor, organizationId, legalEntityId: account.legalEntityId,
      currencyCode: account.currencyCode, cashAccountId: mapping.cashAccountId,
      status: 'POSTED' as const,
    }));
    const match = selectExactCashMatch({
      id: transaction.id, organizationId, legalEntityId: account.legalEntityId,
      currencyCode: account.currencyCode, amountMinor: transaction.amountMinor,
    }, mapping.cashAccountId, candidates);
    results.push({ bankTransactionId: transaction.id, ...match });
  }
  return { bankAccountId, organizationId, results, readOnly: true as const };
}
