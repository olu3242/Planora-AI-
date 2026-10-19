import "server-only";
import type { Prisma } from "@prisma/client";
import { executeRuntimeCommand } from "@/runtime/execution-runtime";
import { proposeBookkeepingCleanup, type CleanupTransaction } from "@/domain/accounting/bookkeeping-cleanup";
import { cleanupBatchFingerprint } from "@/domain/accounting/bookkeeping-cleanup-fingerprint";
import { cleanupRequestIdentity } from "@/domain/accounting/bookkeeping-cleanup-idempotency";

export type CleanupRunContext = {
  organizationId: string; actorId: string; correlationId: string;
  idempotencyKey: string; batchId: string;
};

/** Governed proposal execution. Runtime persists results and audit events; no ledger writes. */
export async function runBookkeepingCleanup(context: CleanupRunContext, transactions: readonly CleanupTransaction[]) {
  if (!context.organizationId || !context.actorId || !context.correlationId || !context.idempotencyKey || !context.batchId) {
    throw new Error("Bookkeeping cleanup requires authenticated tenant, actor and execution identifiers.");
  }
  if (transactions.length > 10000) throw new Error("Bookkeeping cleanup batch exceeds 10000 transactions.");
  if (transactions.some(item => item.organizationId !== context.organizationId)) {
    throw new Error("Cross-tenant bookkeeping cleanup is forbidden.");
  }
  const identity = cleanupRequestIdentity(context.batchId, transactions);
  return executeRuntimeCommand(
    {
      organizationId: context.organizationId,
      actorId: context.actorId,
      correlationId: context.correlationId,
      idempotencyKey: context.idempotencyKey,
      command: "BOOKKEEPING.CLEANUP_PROPOSE",
      targetId: context.batchId,
      retrySafe: true,
      maxAttempts: 2,
      request: { batchId: context.batchId, transactionCount: transactions.length, inputFingerprint: cleanupBatchFingerprint(transactions) } satisfies Prisma.InputJsonValue,
    },
    async () => ({ batchId: context.batchId, findings: proposeBookkeepingCleanup(transactions) }),
    result => result as Prisma.InputJsonValue,
  );
}
