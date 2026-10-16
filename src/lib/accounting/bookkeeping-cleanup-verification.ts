import type { CleanupCase, CleanupAction } from "./bookkeeping-cleanup-workflow";
import { transitionCleanupCase } from "./bookkeeping-cleanup-workflow";
import { validateCleanupExecutionReceipt, type CleanupExecutionReceipt } from "./bookkeeping-cleanup-receipt";

/** Trusted adapter boundary. Only a server-owned accounting adapter may call this.
 * Receipt authenticity and source revision MUST be verified against authoritative
 * accounting records by the caller; receipt fields alone are insufficient proof. */
export function verifyCleanupAfterAccountingExecution(
  current: CleanupCase,
  receipt: CleanupExecutionReceipt,
  action: Pick<CleanupAction, "actorId" | "actorRole" | "expectedRevision">,
): CleanupCase {
  if (current.state !== "EXECUTION_PENDING") throw new Error("CLEANUP_NOT_EXECUTION_PENDING");
  if (action.actorId !== receipt.verifiedBy) throw new Error("CLEANUP_RECEIPT_ACTOR_MISMATCH");
  validateCleanupExecutionReceipt(current, receipt);
  return transitionCleanupCase(current, {
    kind: "VERIFY", ...action, evidenceId: receipt.receiptId,
  });
}
