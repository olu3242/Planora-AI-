import "server-only";
import { prisma } from "@/lib/prisma";
import { withMappingTenant } from "./ai-mapping-tenant-transaction";
import { recordCleanupImportEventInTransaction } from "./bookkeeping-cleanup-outbox";
import { assertVerifiedBankImportCompletion, type VerifiedBankImportCompletion } from "./bookkeeping-import-completion-contract";

/**
 * Integration seam for the authoritative bank-import writer.
 * The import writer MUST invoke this in its existing database transaction;
 * this function does not authenticate a user or mark an import completed.
 */
export async function appendCleanupOutboxForCommittedImport(
  tx: typeof prisma,
  completion: VerifiedBankImportCompletion,
) {
  assertVerifiedBankImportCompletion(completion);
  return recordCleanupImportEventInTransaction(tx, completion);
}

/** Only for verified internal reconciliation/recovery callers, not HTTP input. */
export async function recoverCleanupOutboxForVerifiedImport(completion: VerifiedBankImportCompletion) {
  assertVerifiedBankImportCompletion(completion);
  return withMappingTenant(prisma, completion.organizationId, async connection => {
    return appendCleanupOutboxForCommittedImport(connection as typeof prisma, completion);
  });
}
