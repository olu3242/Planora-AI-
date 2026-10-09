import { Prisma, type PrismaClient } from "@prisma/client";
import { validateJournalLines } from "./ai-native-controls";

export async function reverseJournal(
  db: PrismaClient,
  actor: { userId: string; organizationId: string },
  request: { originalId: string; sourceKey: string; reason: string },
) {
  if (!actor.userId || !actor.organizationId || !request.originalId || !request.sourceKey.trim() || !request.reason.trim()) throw new Error("REVERSAL_REASON_REQUIRED");
  return db.$transaction(async (tx) => {
    const member = await tx.organizationMembership.findFirst({
      where: { userId: actor.userId, organizationId: actor.organizationId, active: true },
    });
    if (!member || !["CFO", "FPA_DIRECTOR"].includes(member.role)) throw new Error("REVERSAL_DENIED");
    const original = await tx.accountingJournal.findFirst({
      where: { id: request.originalId, organizationId: actor.organizationId, status: "POSTED" },
      include: { lines: { orderBy: { ordinal: "asc" } } },
    });
    if (!original) throw new Error("ORIGINAL_NOT_FOUND");
    const period = await tx.fiscalPeriod.findFirst({
      where: { id: original.fiscalPeriodId, year: { calendar: { organizationId: actor.organizationId } } },
    });
    if (!period || period.accountingCloseState !== "OPEN") throw new Error("PERIOD_LOCKED");
    if (original.reversalOfId) throw new Error("REVERSAL_OF_REVERSAL_DENIED");
    const prior = await tx.accountingJournal.findFirst({
      where: { organizationId: actor.organizationId, reversalOfId: original.id },
    });
    if (prior) throw new Error("ALREADY_REVERSED");
    validateJournalLines(original.lines.map(line => ({
      accountId: line.accountId, debitMinor: line.debitMinor, creditMinor: line.creditMinor,
    })));
    const existingKey = await tx.accountingJournal.findUnique({
      where: { organizationId_sourceKey: { organizationId: actor.organizationId, sourceKey: request.sourceKey } },
    });
    if (existingKey) throw new Error("REVERSAL_SOURCE_KEY_CONFLICT");
    const created = await tx.accountingJournal.create({
      data: {
        organizationId: actor.organizationId, legalEntityId: original.legalEntityId,
        fiscalPeriodId: original.fiscalPeriodId, postedById: actor.userId,
        sourceKey: request.sourceKey, currencyCode: original.currencyCode,
        description: request.reason, reversalOfId: original.id,
        status: "DRAFT",
        lines: { create: original.lines.map(line => ({
          ordinal: line.ordinal, accountId: line.accountId,
          debitMinor: line.creditMinor, creditMinor: line.debitMinor,
        })) },
      },
    });
    await tx.accountingJournal.update({
      where: { id: created.id },
      data: { status: "POSTED", postedAt: new Date() },
    });
    await tx.auditEvent.create({
      data: {
        organizationId: actor.organizationId, actorId: actor.userId,
        action: "ACCOUNTING_JOURNAL_REVERSED",
        entityType: "AccountingJournal", entityId: created.id,
        correlationId: request.sourceKey,
        metadata: { originalId: original.id, reason: request.reason },
      },
    });
    return { journalId: created.id };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
