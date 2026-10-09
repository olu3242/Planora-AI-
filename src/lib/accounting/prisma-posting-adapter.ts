import { Prisma, type PrismaClient } from "@prisma/client";
import type { JournalPostingRepository } from "./governed-posting";
import { validateJournalLines } from "./ai-native-controls";

/**
 * Persistence adapter for approved human-initiated postings only.
 * Authentication and approval MUST be derived upstream from a trusted session.
 * Agent-initiated postings are deliberately not supported by this adapter.
 */
export function createPrismaJournalPostingRepository(
  prisma: PrismaClient,
  trustedActorId: string,
  trustedOrganizationId: string,
): JournalPostingRepository {
  return {
    async postAtomically(input) {
      if (input.actorId !== trustedActorId || input.organizationId !== trustedOrganizationId) {
        throw new Error("UNTRUSTED_POSTING_CONTEXT");
      }
      validateJournalLines(input.lines);
      if (!input.organizationId || !input.actorId || !input.legalEntityId || !input.fiscalPeriodId) throw new Error("POSTING_CONTEXT_REQUIRED");
      if (!input.sourceKey.trim()) throw new Error("IDEMPOTENCY_KEY_REQUIRED");
      if (!/^[A-Z]{3}$/.test(input.currencyCode)) throw new Error("CURRENCY_CODE_INVALID");
      return prisma.$transaction(async (tx) => {
        const membership = await tx.organizationMembership.findFirst({
          where: { organizationId: trustedOrganizationId, userId: trustedActorId, active: true },
        });
        if (!membership || !["CFO", "FPA_DIRECTOR"].includes(membership.role)) {
          throw new Error("POSTING_ROLE_DENIED");
        }
        const entity = await tx.legalEntity.findFirst({
          where: { id: input.legalEntityId, organizationId: trustedOrganizationId, active: true },
        });
        if (!entity) throw new Error("ENTITY_NOT_FOUND");
        const period = await tx.fiscalPeriod.findFirst({
          where: {
            id: input.fiscalPeriodId,
            year: { calendar: { organizationId: trustedOrganizationId } },
          },
        });
        if (!period || period.accountingCloseState !== "OPEN") throw new Error("PERIOD_NOT_OPEN");
        const currency = await tx.currency.findUnique({ where: { code: input.currencyCode } });
        if (!currency) throw new Error("UNKNOWN_CURRENCY");
        const accountIds = [...new Set(input.lines.map((line) => line.accountId))];
        const accounts = await tx.account.findMany({
          where: { id: { in: accountIds }, organizationId: trustedOrganizationId, active: true },
        });
        if (accounts.length !== accountIds.length) throw new Error("INVALID_ACCOUNTS");
        const existing = await tx.accountingJournal.findUnique({
          where: { organizationId_sourceKey: { organizationId: trustedOrganizationId, sourceKey: input.sourceKey } },
        });
        if (existing) {
          if (existing.postedById !== trustedActorId || existing.status !== "POSTED" || existing.legalEntityId !== input.legalEntityId ||
              existing.fiscalPeriodId !== input.fiscalPeriodId || existing.currencyCode !== input.currencyCode) {
            throw new Error("IDEMPOTENCY_CONFLICT");
          }
          const existingLines = await tx.accountingJournalLine.findMany({
            where: { journalId: existing.id }, orderBy: { ordinal: "asc" },
          });
          if (existingLines.length !== input.lines.length || existingLines.some((line, i) =>
            line.accountId !== input.lines[i].accountId ||
            line.debitMinor !== input.lines[i].debitMinor ||
            line.creditMinor !== input.lines[i].creditMinor)) throw new Error("IDEMPOTENCY_CONFLICT");
          return { journalId: existing.id, created: false };
        }
        const postingDate = period.endDate;
        if (accounts.some((account) => account.effectiveFrom > postingDate || (account.effectiveTo && account.effectiveTo < period.startDate))) throw new Error("ACCOUNT_NOT_EFFECTIVE");
        const journal = await tx.accountingJournal.create({
          data: {
            organizationId: trustedOrganizationId, legalEntityId: input.legalEntityId,
            fiscalPeriodId: input.fiscalPeriodId, postedById: trustedActorId,
            sourceKey: input.sourceKey, currencyCode: input.currencyCode,
            status: "DRAFT",
            lines: { create: input.lines.map((line, ordinal) => ({
              ordinal, accountId: line.accountId, debitMinor: line.debitMinor, creditMinor: line.creditMinor,
            })) },
          },
        });
        await tx.accountingJournal.update({
          where: { id: journal.id },
          data: { status: "POSTED", postedAt: new Date() },
        });
        await tx.auditEvent.create({
          data: {
            organizationId: trustedOrganizationId,
            actorId: trustedActorId,
            action: "ACCOUNTING_JOURNAL_POSTED",
            entityType: "AccountingJournal",
            entityId: journal.id,
            correlationId: input.sourceKey,
            newState: {
              journalId: journal.id,
              legalEntityId: input.legalEntityId,
              fiscalPeriodId: input.fiscalPeriodId,
              currencyCode: input.currencyCode,
              sourceKey: input.sourceKey,
              lines: input.lines.map((line, ordinal) => ({
                ordinal, accountId: line.accountId,
                debitMinor: line.debitMinor.toString(),
                creditMinor: line.creditMinor.toString(),
              })),
            },
          },
        });
        return { journalId: journal.id, created: true };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
  };
}
