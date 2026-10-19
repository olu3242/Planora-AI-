import { cleanupBatchFingerprint } from "./bookkeeping-cleanup-fingerprint";
import type { CleanupTransaction } from "./bookkeeping-cleanup";
export function cleanupRequestIdentity(batchId: string, transactions: readonly CleanupTransaction[]) {
 if (!batchId.trim()) throw new Error("Batch ID required.");
 return { batchId: batchId.trim(), fingerprint: cleanupBatchFingerprint(transactions) };
}
