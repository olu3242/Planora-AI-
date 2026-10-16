import "server-only";
import type { PrismaClient } from "@prisma/client";
import { recordCleanupImportEventInTransaction } from "./bookkeeping-cleanup-outbox";
import { assertVerifiedBankImportCompletion, type VerifiedBankImportCompletion } from "./bookkeeping-import-completion-contract";

/**
 * Invoke ONLY from the authoritative bank-import writer inside its own
 * transaction, after it has persisted the completed import record.
 * This helper does not independently establish authentication or completion.
 */
export async function appendCleanupOutboxForCommittedImport(
  tx: PrismaClient,
  completion: VerifiedBankImportCompletion,
) {
  assertVerifiedBankImportCompletion(completion);
  return recordCleanupImportEventInTransaction(tx, completion);
}
