/** Independently attested accounting execution evidence; not a posting engine. */
export type CleanupExecutionReceipt = Readonly<{
  receiptId: string;
  caseId: string;
  organizationId: string;
  legalEntityId: string;
  fiscalPeriodId: string;
  accountingOperationId: string;
  operationType: "CORRECTING_JOURNAL" | "BANK_RECONCILIATION" | "SOURCE_RECLASSIFICATION";
  outcome: "SUCCEEDED" | "FAILED";
  verifiedBy: string;
  verifiedAt: string;
  sourceRevision: string;
}>;
export function validateCleanupExecutionReceipt(
  scope: { id: string; organizationId: string; legalEntityId: string; fiscalPeriodId: string; proposedBy: string | null },
  receipt: CleanupExecutionReceipt,
): void {
  if (receipt.caseId !== scope.id || receipt.organizationId !== scope.organizationId ||
      receipt.legalEntityId !== scope.legalEntityId || receipt.fiscalPeriodId !== scope.fiscalPeriodId) {
    throw new Error("CLEANUP_RECEIPT_SCOPE_MISMATCH");
  }
  if (receipt.outcome !== "SUCCEEDED" || !receipt.accountingOperationId.trim() ||
      !receipt.receiptId.trim() || !receipt.sourceRevision.trim() ||
      !receipt.verifiedBy.trim() || receipt.verifiedBy === scope.proposedBy ||
      !Number.isFinite(Date.parse(receipt.verifiedAt))) {
    throw new Error("CLEANUP_RECEIPT_UNVERIFIED");
  }
}
