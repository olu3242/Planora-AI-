import 'server-only';
import { prisma } from '@/lib/prisma';
import { validateReconciliationTrace } from '@/domain/accounting/reconciliation-trace';

/** Read-only reconciliation evidence, anchored to the canonical posted journal. */
export async function getReconciliationJournalTrace(
  organizationId: string, bankTransactionId: string,
) {
  const movement = await prisma.bankTransaction.findFirst({
    where: { id: bankTransactionId, bankAccount: { organizationId } },
    select: {
      id: true, status: true, amountMinor: true, matchedJournalId: true,
      bankAccount: { select: { organizationId: true, legalEntityId: true, currencyCode: true } },
      matchedJournal: {
        select: {
          id: true, status: true, reversedBy: true, legalEntityId: true,
          organizationId: true, currencyCode: true, fiscalPeriodId: true,
          lines: { select: { accountId: true, debitMinor: true, creditMinor: true, account: { select: { systemPurpose: true } } } },
        },
      },
    },
  });
  if (!movement || !movement.matchedJournalId || !movement.matchedJournal) return null;
  if (movement.status !== 'MATCHED') throw new Error('RECONCILIATION_TRACE_NOT_MATCHED');
  const journal = movement.matchedJournal;
  if (journal.status !== 'POSTED' || journal.reversedBy) throw new Error('RECONCILIATION_TRACE_JOURNAL_NOT_POSTED');
  if (journal.id !== movement.matchedJournalId) throw new Error('RECONCILIATION_TRACE_JOURNAL_MISMATCH');
  if (journal.organizationId !== organizationId ||
      journal.legalEntityId !== movement.bankAccount.legalEntityId ||
      journal.currencyCode !== movement.bankAccount.currencyCode) throw new Error('RECONCILIATION_TRACE_SCOPE_MISMATCH');
  const cash = new Map<string, bigint>();
  for (const line of journal.lines) {
    if (line.account.systemPurpose === 'CASH') {
      cash.set(line.accountId, (cash.get(line.accountId) ?? 0n) + line.debitMinor - line.creditMinor);
    }
  }
  const eligible = [...cash.entries()].filter(([, amount]) => amount === movement.amountMinor);
  if (eligible.length !== 1) throw new Error('RECONCILIATION_TRACE_CASH_AMBIGUOUS');
  const [cashAccountId] = eligible[0];
  const result = validateReconciliationTrace({
    bankTransactionId: movement.id, journalId: journal.id, organizationId,
    legalEntityId: journal.legalEntityId, cashAccountId, amountMinor: movement.amountMinor,
    currencyCode: journal.currencyCode, bankStatus: movement.status,
    journalStatus: journal.status, journalReversed: Boolean(journal.reversedBy),
  });
  if (!result.valid) throw new Error(result.reason);
  return {
    bankTransactionId: movement.id, journalId: journal.id,
    fiscalPeriodId: journal.fiscalPeriodId, legalEntityId: journal.legalEntityId,
    cashAccountId, amountMinor: movement.amountMinor.toString(),
    currencyCode: journal.currencyCode, source: 'CANONICAL_POSTED_JOURNAL' as const,
  };
}
