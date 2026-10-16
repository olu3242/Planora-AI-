import { describe, expect, it } from "vitest";
import { createCleanupCase, transitionCleanupCase } from "../../src/lib/accounting/bookkeeping-cleanup-workflow";
import { verifyCleanupAfterAccountingExecution } from "../../src/lib/accounting/bookkeeping-cleanup-verification";
import type { CleanupExecutionReceipt } from "../../src/lib/accounting/bookkeeping-cleanup-receipt";
const scope = { organizationId: "org", legalEntityId: "entity", fiscalPeriodId: "period" };
const issue = { key: "unmatched:b", kind: "UNMATCHED_BANK" as const, severity: "MEDIUM" as const, recordIds: ["b"], recommendation: "Review", requiresApproval: true as const };
function pending() {
  let c = createCleanupCase(scope, issue);
  c = transitionCleanupCase(c, { kind: "INVESTIGATE", actorId: "bookkeeper", actorRole: "BOOKKEEPER", evidenceId: "e1", expectedRevision: 0 });
  c = transitionCleanupCase(c, { kind: "PROPOSE", actorId: "bookkeeper", actorRole: "BOOKKEEPER", evidenceId: "e2", proposal: "Fix", expectedRevision: 1 });
  c = transitionCleanupCase(c, { kind: "APPROVE", actorId: "controller", actorRole: "CONTROLLER", evidenceId: "e3", expectedRevision: 2 });
  return transitionCleanupCase(c, { kind: "QUEUE_EXECUTION", actorId: "controller", actorRole: "CONTROLLER", evidenceId: "e4", expectedRevision: 3 });
}
const receipt = (c: ReturnType<typeof pending>): CleanupExecutionReceipt => ({
  receiptId: "receipt1", caseId: c.id, organizationId: c.organizationId, legalEntityId: c.legalEntityId,
  fiscalPeriodId: c.fiscalPeriodId, accountingOperationId: "journal-42",
  operationType: "CORRECTING_JOURNAL", outcome: "SUCCEEDED",
  verifiedBy: "accountant", verifiedAt: "2026-10-16T12:00:00Z", sourceRevision: "rev2",
});
describe("cleanup independent execution verification", () => {
  it("accepts a correctly scoped receipt from an independent reviewer", () => {
    const c = pending();
    expect(verifyCleanupAfterAccountingExecution(c, receipt(c), { actorId: "accountant", actorRole: "ACCOUNTANT", expectedRevision: 4 }).state).toBe("VERIFIED");
  });
  it("rejects foreign organization receipt", () => {
    const c = pending();
    expect(() => verifyCleanupAfterAccountingExecution(c, { ...receipt(c), organizationId: "other" }, { actorId: "accountant", actorRole: "ACCOUNTANT", expectedRevision: 4 })).toThrow("CLEANUP_RECEIPT_SCOPE_MISMATCH");
  });
  it("rejects unsuccessful operations", () => {
    const c = pending();
    expect(() => verifyCleanupAfterAccountingExecution(c, { ...receipt(c), outcome: "FAILED" }, { actorId: "accountant", actorRole: "ACCOUNTANT", expectedRevision: 4 })).toThrow("CLEANUP_RECEIPT_UNVERIFIED");
  });
  it("rejects receipt actor mismatch", () => {
    const c = pending();
    expect(() => verifyCleanupAfterAccountingExecution(c, receipt(c), { actorId: "controller", actorRole: "CONTROLLER", expectedRevision: 4 })).toThrow("CLEANUP_RECEIPT_ACTOR_MISMATCH");
  });
  it("rejects stale revision", () => {
    const c = pending();
    expect(() => verifyCleanupAfterAccountingExecution(c, receipt(c), { actorId: "accountant", actorRole: "ACCOUNTANT", expectedRevision: 3 })).toThrow("STALE_CLEANUP_REVISION");
  });
});
