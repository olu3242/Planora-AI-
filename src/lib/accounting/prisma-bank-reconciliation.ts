import { Prisma, type PrismaClient } from '@prisma/client';
import { reconciliationEligible } from '@/domain/accounting/reconciliation-eligibility';

/** Use only with a trusted actor/tenant context and tenant-scoped database access. */
export async function reconcileBankTransaction(
  db: PrismaClient,
  trusted: { actorId: string; organizationId: string },
  request: { bankTransactionId: string; journalId: string; cashAccountId: string },
) {
  if (![trusted.actorId, trusted.organizationId, request.bankTransactionId, request.journalId, request.cashAccountId]
    .every(value => typeof value === 'string' && value.trim().length > 0)) {
    throw new Error('RECONCILIATION_CONTEXT_REQUIRED');
  }
  return db.$transaction(async tx => {
    const membership = await tx.organizationMembership.findFirst({
      where: { userId: trusted.actorId, organizationId: trusted.organizationId, active: true },
    });
    if (!membership || !['CFO', 'FPA_DIRECTOR'].includes(membership.role)) {
      throw new Error('RECONCILIATION_ROLE_DENIED');
    }
    const bank = await tx.bankTransaction.findFirst({
      where: { id: request.bankTransactionId, bankAccount: { organizationId: trusted.organizationId, active: true } },
      include: { bankAccount: true },
    });
    if (!bank) throw new Error('BANK_TRANSACTION_NOT_FOUND');
    if (bank.status === 'MATCHED' && bank.matchedJournalId === request.journalId) {
      return { created: false, bankTransactionId: bank.id, journalId: request.journalId };
    }
    const mapping = await tx.bankCashMapping.findMany({
      where: {
        organizationId: trusted.organizationId, bankAccountId: bank.bankAccountId,
        cashAccountId: request.cashAccountId, approvedAt: { not: null },
        approvedById: { not: null }, revokedAt: null,
        effectiveFrom: { lte: bank.postedDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: bank.postedDate } }],
      },
      include: { cashAccount: true },
    });
    if (mapping.length !== 1 || mapping[0].preparedById === mapping[0].approvedById ||
        mapping[0].cashAccount.organizationId !== trusted.organizationId ||
        !mapping[0].cashAccount.active || mapping[0].cashAccount.systemPurpose !== 'CASH') {
      throw new Error('BANK_LEDGER_MAPPING_REQUIRED');
    }
    if (mapping[0].cashAccount.effectiveFrom > bank.postedDate ||
        (mapping[0].cashAccount.effectiveTo && mapping[0].cashAccount.effectiveTo < bank.postedDate)) {
      throw new Error('CASH_ACCOUNT_NOT_EFFECTIVE');
    }
    const journal = await tx.accountingJournal.findFirst({
      where: { id: request.journalId, organizationId: trusted.organizationId },
    });
    if (!journal) throw new Error('JOURNAL_NOT_FOUND');
    const lines = await tx.accountingJournalLine.findMany({
      where: { journalId: journal.id, accountId: request.cashAccountId },
      select: { debitMinor: true, creditMinor: true },
    });
    const cashAmount = lines.reduce((sum, line) => sum + line.debitMinor - line.creditMinor, 0n);
    const otherMatch = await tx.bankTransaction.findFirst({
      where: { matchedJournalId: journal.id, status: 'MATCHED' }, select: { id: true },
    });
    if (!reconciliationEligible({
      sameTenant: bank.bankAccount.organizationId === journal.organizationId,
      sameEntity: bank.bankAccount.legalEntityId === journal.legalEntityId,
      sameCurrency: bank.bankAccount.currencyCode === journal.currencyCode,
      mappingApproved: true, bankUnmatched: bank.status === 'UNMATCHED' && !bank.matchedJournalId,
      journalPosted: journal.status === 'POSTED' && !journal.reversalOfId,
      journalAvailable: !otherMatch && !journal.reversedBy,
      bankAmount: bank.amountMinor, cashAmount,
    })) throw new Error('RECONCILIATION_INELIGIBLE');
    const changed = await tx.bankTransaction.updateMany({
      where: { id: bank.id, status: 'UNMATCHED', matchedJournalId: null },
      data: { status: 'MATCHED', matchedJournalId: journal.id },
    });
    if (changed.count !== 1) throw new Error('RECONCILIATION_CONFLICT');
    await tx.auditEvent.create({
      data: {
        organizationId: trusted.organizationId, actorId: trusted.actorId,
        action: 'BANK_RECONCILIATION_MATCHED', entityType: 'BankTransaction',
        entityId: bank.id, correlationId: bank.externalId,
        newState: { journalId: journal.id, cashAccountId: request.cashAccountId, amountMinor: cashAmount.toString() },
      },
    });
    return { created: true, bankTransactionId: bank.id, journalId: journal.id };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
