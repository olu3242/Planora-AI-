import "server-only";
import { prisma } from "@/lib/prisma";
import { withMappingTenant } from "./ai-mapping-tenant-transaction";
import { verifyReadinessScopeInTransaction } from "./financial-readiness-scope-query";
import { cleanupNextAction, cleanupRetryDelay } from "./bookkeeping-cleanup-retry";
import { cleanupImportJobKey } from "./bookkeeping-cleanup-import-key";

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
      where: { id: jobId, organizationId, OR: [{ status: { in: ["QUEUED", "RETRY_WAIT"] }, nextAttemptAt: { lte: now } }, { status: "RUNNING", leaseExpiresAt: { lte: now } }] },
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

/** Bounded tenant-scoped candidate selection; claim remains atomic and fenced. */
export async function listDueCleanupJobs(organizationId: string, limit = 20) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("INVALID_CLEANUP_LIMIT");
  return withMappingTenant(prisma, organizationId, async connection => {
    const tx = connection as typeof prisma;
    const now = new Date();
    return tx.bookkeepingCleanupJob.findMany({
      where: {
        organizationId,
        OR: [
          { status: { in: ["QUEUED", "RETRY_WAIT"] }, nextAttemptAt: { lte: now } },
          { status: "RUNNING", leaseExpiresAt: { lte: now } },
        ],
      },
      orderBy: [{ nextAttemptAt: "asc" }, { id: "asc" }],
      take: limit,
      select: { id: true, organizationId: true, legalEntityId: true, fiscalPeriodId: true },
    });
  });
}

/** Trusted import event caller only. New imports enqueue fresh jobs without resetting older work. */
export async function enqueueCleanupForImport(scope: {
  organizationId: string; legalEntityId: string; fiscalPeriodId: string; importEventId: string;
}) {
  const jobKey = cleanupImportJobKey(scope.legalEntityId, scope.fiscalPeriodId, scope.importEventId);
  return withMappingTenant(prisma, scope.organizationId, async connection => {
    const tx = connection as typeof prisma;
    await verifyReadinessScopeInTransaction(tx, scope.organizationId, scope.legalEntityId, scope.fiscalPeriodId);
    return tx.bookkeepingCleanupJob.upsert({
      where: { organizationId_jobKey: { organizationId: scope.organizationId, jobKey } },
      create: {
        organizationId: scope.organizationId, legalEntityId: scope.legalEntityId,
        fiscalPeriodId: scope.fiscalPeriodId, jobKey,
      },
      update: {},
    });
  });
}

/** Renew only an active lease with the exact fencing token. */
export async function renewCleanupLease(organizationId: string, jobId: string, leaseToken: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leaseToken)) {
    throw new Error("INVALID_LEASE_TOKEN");
  }
  return withMappingTenant(prisma, organizationId, async connection => {
    const tx = connection as typeof prisma;
    const now = new Date();
    const updated = await tx.bookkeepingCleanupJob.updateMany({
      where: { id: jobId, organizationId, status: "RUNNING", leaseToken, leaseExpiresAt: { gt: now } },
      data: { leaseExpiresAt: new Date(now.getTime() + 60000), updatedAt: now },
    });
    if (updated.count !== 1) throw new Error("CLEANUP_LEASE_LOST");
    return true;
  });
}

/** Tenant-isolated operational counters; no cross-tenant admin bypass. */
export async function cleanupJobHealth(organizationId: string) {
  return withMappingTenant(prisma, organizationId, async connection => {
    const tx = connection as typeof prisma;
    const now = new Date();
    const [queued, running, retrying, escalated, expired] = await Promise.all([
      tx.bookkeepingCleanupJob.count({ where: { organizationId, status: "QUEUED" } }),
      tx.bookkeepingCleanupJob.count({ where: { organizationId, status: "RUNNING" } }),
      tx.bookkeepingCleanupJob.count({ where: { organizationId, status: "RETRY_WAIT" } }),
      tx.bookkeepingCleanupJob.count({ where: { organizationId, status: "ESCALATED" } }),
      tx.bookkeepingCleanupJob.count({ where: { organizationId, status: "RUNNING", leaseExpiresAt: { lte: now } } }),
    ]);
    return { queued, running, retrying, escalated, expired };
  });
}
