import "server-only";
import { prisma } from "@/lib/prisma";
import { withMappingTenant } from "./ai-mapping-tenant-transaction";
import { verifyReadinessScopeInTransaction } from "./financial-readiness-scope-query";
import { enqueueCleanupForImport } from "./bookkeeping-cleanup-job-repository";

export type CleanupImportEvent = {
  organizationId: string; legalEntityId: string; fiscalPeriodId: string; importEventId: string;
};

/** Called inside the same trusted DB transaction that marks a bank import complete. */
export async function recordCleanupImportEventInTransaction(
  tx: typeof prisma, event: CleanupImportEvent,
) {
  await verifyReadinessScopeInTransaction(tx, event.organizationId, event.legalEntityId, event.fiscalPeriodId);
  return tx.bookkeepingCleanupOutbox.upsert({
    where: { organizationId_importEventId: { organizationId: event.organizationId, importEventId: event.importEventId } },
    create: event,
    update: {},
  });
}

/** At-least-once outbox dispatcher. Job deduplication tolerates delivery retries. */
export async function deliverCleanupImportOutbox(organizationId: string, limit = 20) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("INVALID_OUTBOX_LIMIT");
  const pending = await withMappingTenant(prisma, organizationId, async connection => {
    const tx = connection as typeof prisma;
    return tx.bookkeepingCleanupOutbox.findMany({
      where: { organizationId, state: "PENDING" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: limit,
    });
  });
  let delivered = 0;
  for (const event of pending) {
    await enqueueCleanupForImport({
      organizationId, legalEntityId: event.legalEntityId,
      fiscalPeriodId: event.fiscalPeriodId, importEventId: event.importEventId,
    });
    await withMappingTenant(prisma, organizationId, async connection => {
      const tx = connection as typeof prisma;
      await tx.bookkeepingCleanupOutbox.updateMany({
        where: { id: event.id, organizationId, state: "PENDING" },
        data: { state: "DELIVERED", deliveredAt: new Date() },
      });
    });
    delivered++;
  }
  return { inspected: pending.length, delivered };
}
