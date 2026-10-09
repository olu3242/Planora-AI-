import "server-only";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/auth/session";
import { validatePostingIntent } from "@/domain/accounting/posting-policy";
import type { JournalLineInput } from "@/domain/accounting/journal-validation";

export type PostJournalCommand = Readonly<{
  legalEntityId: string;
  fiscalPeriodId: string;
  currency: string;
  sourceKey: string;
  description?: string;
  lines: readonly JournalLineInput[];
}>;

/** Synthetic-only foundation. Do not expose through a route before DB migration and integration certification. */
export async function postJournal(command: PostJournalCommand) {
  const session = await requireApiSession("financial.write");
  const organizationId = session.organization.id;
  return prisma.$transaction(async (tx) => {
    // Lock the period row before checking its state; period-close commands must
    // acquire the same lock in their own transaction.
    const rows = await tx.$queryRaw<Array<{ id: string; accountingCloseState: string }>>`
      SELECT "id", "accountingCloseState"
      FROM "FiscalPeriod"
      WHERE "id" = ${command.fiscalPeriodId}::uuid
      FOR UPDATE
    `;
    const period = rows[0];
    if (!period) throw new Error("PERIOD_NOT_FOUND");
    const entity = await tx.legalEntity.findFirst({
      where: { id: command.legalEntityId, organizationId, active: true },
    });
    const fiscal = await tx.fiscalPeriod.findFirst({
      where: { id: command.fiscalPeriodId, year: { calendar: { organizationId } } },
    });
    if (!entity || !fiscal) throw new Error("ENTITY_OR_PERIOD_NOT_IN_TENANT");
    const uniqueAccounts = [...new Set(command.lines.map((line) => line.accountId))];
    const accounts = await tx.account.findMany({
      where: { id: { in: uniqueAccounts }, organizationId, active: true },
      select: { id: true, parentId: true, effectiveFrom: true, effectiveTo: true },
    });
    if (accounts.length !== uniqueAccounts.length || accounts.some((a) => a.parentId !== null ||
      a.effectiveFrom > fiscal.endDate || (a.effectiveTo && a.effectiveTo < fiscal.startDate))) {
      throw new Error("INVALID_POSTING_ACCOUNT");
    }
    const existing = await tx.accountingJournal.findUnique({
      where: { organizationId_sourceKey: { organizationId, sourceKey: command.sourceKey } },
    });
    validatePostingIntent({
      organizationId, legalEntityId: command.legalEntityId,
      periodId: command.fiscalPeriodId, currency: command.currency,
      sourceKey: command.sourceKey, lines: command.lines,
    }, {
      organizationId, legalEntityId: entity.id, periodId: fiscal.id,
      allowedCurrency: command.currency,
      periodState: period.accountingCloseState as "OPEN" | "SOFT_CLOSED" | "HARD_CLOSED",
      existingSourceKey: existing?.sourceKey,
    });
    const journal = await tx.accountingJournal.create({
      data: {
        organizationId, legalEntityId: entity.id, fiscalPeriodId: fiscal.id,
        currencyCode: command.currency, sourceKey: command.sourceKey,
        description: command.description, status: "POSTED",
        postedById: session.user.id, postedAt: new Date(),
        lines: { create: command.lines.map((line, ordinal) => ({
          accountId: line.accountId, ordinal,
          debitMinor: line.debitMinor, creditMinor: line.creditMinor,
        })) },
      },
      select: { id: true },
    });
    await tx.auditEvent.create({
      data: {
        organizationId, actorId: session.user.id,
        action: "accounting.journal.post", entityType: "AccountingJournal",
        entityId: journal.id, correlationId: command.sourceKey,
        metadata: { sourceKey: command.sourceKey, periodId: fiscal.id, lineCount: command.lines.length },
      },
    });
    return { journalId: journal.id, status: "POSTED" as const };
  });
}
