import "server-only";
import { prisma } from "@/lib/prisma";
import { withMappingTenant } from "./ai-mapping-tenant-transaction";
import { verifyReadinessScopeInTransaction } from "./financial-readiness-scope-query";
import { cleanupImportJobKey } from "./bookkeeping-cleanup-import-key";

export type CleanupImportEvent = {
  organizationId: string; legalEntityId: string; fiscalPeriodId: string; importEventId: string;
};

/** Invoke in the same tenant transaction that commits a verified bank import. */
export async function recordCleanupImportEventInTransaction(
  tx: typeof prisma, event: CleanupImportEvent,
) {
  await verifyReadinessScopeInTransaction(tx, event.organizationId, event.legalEntityId, event.fiscalPeriodId);
  const existing = await tx.bookkeepingCleanupOutbox.findUnique({
    where: { organizationId_importEventId: { organizationId: event.organizationId, importEventId: event.importEventId } },
  });
  if (existing && (existing.legalEntityId !== event.legalEntityId || existing.fiscalPeriodId !== event.fiscalPeriodId)) {
    throw new Error("CLEANUP_IMPORT_EVENT_SCOPE_CONFLICT");
  }
  return tx.bookkeepingCleanupOutbox.upsert({
    where: { organizationId_importEventId: { organizationId: event.organizationId, importEventId: event.importEventId } },
    create: event,
    update: {},
  });
}

/** Atomic at-least-once delivery: enqueue and acknowledgement commit together. */
export async function deliverCleanupImportOutbox(organizationId: string, limit = 20) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("INVALID_OUTBOX_LIMIT");
  return withMappingTenant(prisma, organizationId, async connection => {
    const tx = connection as typeof prisma;
    const pending = await tx.bookkeepingCleanupOutbox.findMany({
      where: { organizationId, state: "PENDING" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: limit,
    });
    let delivered = 0;
    for (const event of pending) {
      await verifyReadinessScopeInTransaction(tx, organizationId, event.legalEntityId, event.fiscalPeriodId);
      const jobKey = cleanupImportJobKey(event.legalEntityId, event.fiscalPeriodId, event.importEventId);
      await tx.bookkeepingCleanupJob.upsert({
        where: { organizationId_jobKey: { organizationId, jobKey } },
        create: {
          organizationId, legalEntityId: event.legalEntityId,
          fiscalPeriodId: event.fiscalPeriodId, jobKey,
        },
        update: {},
      });
      const acknowledgement = await tx.bookkeepingCleanupOutbox.updateMany({
        where: { id: event.id, organizationId, state: "PENDING" },
        data: { state: "DELIVERED", deliveredAt: new Date() },
      });
      delivered += acknowledgement.count;
    }
    return { inspected: pending.length, delivered };
  });
}
