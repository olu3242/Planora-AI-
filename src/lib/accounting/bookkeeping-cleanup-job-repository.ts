import "server-only";
import { prisma } from "@/lib/prisma";
import { withMappingTenant } from "./ai-mapping-tenant-transaction";
import { verifyReadinessScopeInTransaction } from "./financial-readiness-scope-query";
import { cleanupNextAction, cleanupRetryDelay } from "./bookkeeping-cleanup-retry";

export async function enqueueCleanupScan(scope: { organizationId: string; legalEntityId: string; fiscalPeriodId: string }) {
  return withMappingTenant(prisma, scope.organizationId, async connection => {
    const tx = connection as typeof prisma;
    await verifyReadinessScopeInTransaction(tx, scope.organizationId, scope.legalEntityId, scope.fiscalPeriodId);
    return tx.bookkeepingCleanupJob.upsert({
      where: { organizationId_jobKey: { organizationId: scope.organizationId, jobKey: `reconciliation:${scope.legalEntityId}:${scope.fiscalPeriodId}` } },
      create: { ...scope, jobKey: `reconciliation:${scope.legalEntityId}:${scope.fiscalPeriodId}` },
      update: {},
    });
  });
}

/** Tenant-scoped lease claim; only an authenticated internal worker may invoke. */
export async function claimCleanupScan(organizationId: string, jobId: string, leaseToken: string) {
  if (!/^[0-9a-f-]{36}$/i.test(leaseToken)) throw new Error("INVALID_LEASE_TOKEN");
  return withMappingTenant(prisma, organizationId, async connection => {
    const tx = connection as typeof prisma;
    const now = new Date();
    const claimed = await tx.bookkeepingCleanupJob.updateMany({
      where: { id: jobId, organizationId, status: { in: ["QUEUED", "RETRY_WAIT"] }, nextAttemptAt: { lte: now } },
      data: { status: "RUNNING", leaseToken, leaseExpiresAt: new Date(now.getTime() + 60000), updatedAt: now },
    });
    return claimed.count === 1;
  });
}
export async function finishCleanupScan(organizationId: string, jobId: string, leaseToken: string, errorCode?: string) {
  return withMappingTenant(prisma, organizationId, async connection => {
    const tx = connection as typeof prisma;
    const row = await tx.bookkeepingCleanupJob.findFirst({
      where: { id: jobId, organizationId, status: "RUNNING", leaseToken, leaseExpiresAt: { gt: new Date() } },
    });
    if (!row) throw new Error("CLEANUP_LEASE_LOST");
    const attempts = row.attempts + (errorCode ? 1 : 0);
    const next = errorCode ? cleanupNextAction(attempts, errorCode) : "DONE";
    const updated = await tx.bookkeepingCleanupJob.updateMany({
      where: { id: jobId, organizationId, status: "RUNNING", leaseToken, leaseExpiresAt: { gt: new Date() } },
      data: {
        status: next === "DONE" ? "COMPLETED" : next === "ESCALATE" ? "ESCALATED" : "RETRY_WAIT",
        attempts, lastError: errorCode ?? null,
        nextAttemptAt: next === "RETRY" ? new Date(Date.now() + cleanupRetryDelay(attempts)) : row.nextAttemptAt,
        leaseToken: null, leaseExpiresAt: null, updatedAt: new Date(),
      },
    });
    if (updated.count !== 1) throw new Error("CLEANUP_LEASE_LOST");
  });
}
