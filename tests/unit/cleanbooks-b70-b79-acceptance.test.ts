import { describe, expect, it } from "vitest";
import { assembleCleanBooksScan } from "../../src/lib/cleanbooks/scan-pipeline";
import { suggestCategories } from "../../src/lib/cleanbooks/category-suggestions";
import { proposeReconciliation } from "../../src/lib/cleanbooks/reconciliation";
import { investigateSuspense } from "../../src/lib/cleanbooks/suspense";
import { inspectOpenItems } from "../../src/lib/cleanbooks/receivables";
import { draftCorrection } from "../../src/lib/cleanbooks/corrections";
import { checkLedgerIntegrity } from "../../src/lib/cleanbooks/integrity";
import { requireIndependentApproval } from "../../src/lib/cleanbooks/b13-approval";
import { cleanBooksReleaseGate } from "../../src/lib/cleanbooks/b19-release-gate";
import { cleanupClosureGate } from "../../src/lib/cleanbooks/b69-closure-gate";
const scope = { organizationId: "tenant-1", legalEntityId: "entity-1" };
const tx = { id: "tx-1", ...scope, currency: "USD", amountMinor: 12500, bookedAt: "2026-10-15", description: "Utility bill", sourceReference: "bank-1", sourceAccountId: "bank-account-1", accountId: null };
describe("CleanBooks B70-B79 cross-module acceptance contracts", () => {
 it("B70: cross-entity scan fails closed", () => expect(() => assembleCleanBooksScan([{ ...tx, legalEntityId: "entity-2" }], scope, true)).toThrow("CLEANBOOKS_CROSS_SCOPE"));
 it("B71: same-bank duplicate requires review", () => {
  const result = assembleCleanBooksScan([tx, { ...tx, id: "tx-2" }], scope, true);
  expect(result.duplicates).toHaveLength(1);
  expect(result.duplicates[0].decision).toBe("REVIEW_REQUIRED");
  expect(result.canPost).toBe(false);
 });
 it("B72: cross-bank transactions remain independent", () => {
  const result = assembleCleanBooksScan([tx, { ...tx, id: "tx-2", sourceAccountId: "bank-account-2" }], scope, true);
  expect(result.duplicates).toHaveLength(0);
 });
 it("B73: conflicting classification rules produce no suggestion", () => {
  const base = { id: "rule-1", ...scope, keyword: "utility", accountId: "gl-1", active: true };
  expect(suggestCategories([tx], [base, { ...base, id: "rule-2", accountId: "gl-2" }], scope)).toHaveLength(0);
 });
 it("B74: ambiguous reconciliation never auto-matches", () => {
  const bank = { id: "bank-1", ...scope, currency: "USD", amountMinor: 12500, bookedAt: "2026-10-15", reference: "Utility bill" };
  const journal = { ...bank, id: "journal-1", posted: true, locked: false };
  const result = proposeReconciliation([bank], [journal, { ...journal, id: "journal-2" }], scope);
  expect(result.matches).toHaveLength(0);
  expect(result.unmatchedBankIds).toEqual(["bank-1"]);
 });
 it("B75: locked suspense is escalated without posting", () => {
  expect(investigateSuspense([{ id: "line-1", ...scope, accountId: "suspense", amountMinor: 12500, periodLocked: true }], ["suspense"], scope)[0].reason).toBe("LOCKED_PERIOD");
 });
 it("B76: overdue AP remains a review finding", () => {
  expect(inspectOpenItems([{ id: "bill-1", ...scope, kind: "AP", dueDate: "2026-09-01", outstandingMinor: 12500, status: "OPEN" }], scope, "2026-10-15")[0].decision).toBe("REVIEW_REQUIRED");
 });
 it("B77: unbalanced correction and ledger are rejected", () => {
  expect(() => draftCorrection({ ...scope, fiscalPeriodId: "period", reason: "adjustment", periodLocked: false, lines: [{ accountId: "a", debitMinor: 100, creditMinor: 0 }, { accountId: "b", debitMinor: 0, creditMinor: 99 }] })).toThrow("UNBALANCED_JOURNAL");
  expect(checkLedgerIntegrity([{ id: "line", ...scope, journalId: "journal", debitMinor: 100, creditMinor: 0 }], scope).balanced).toBe(false);
 });
 it("B78: self-approval is prohibited", () => expect(() => requireIndependentApproval({ requesterId: "actor", reviewerId: "actor", reviewerAuthorized: true, periodLocked: false, evidenceCount: 1 })).toThrow("SEGREGATION_OF_DUTIES"));
 it("B79: absent hosted evidence prevents release and closure", () => {
  const gates = { baselineValid: true, unitPassed: true, integrationPassed: true, browserPassed: true, securityPassed: true, coverageComplete: true, hostedPassed: false };
  expect(cleanBooksReleaseGate(gates).decision).toBe("NO_GO");
  expect(cleanupClosureGate({ coverageComplete: true, allFindingsReviewed: true, independentApproval: true, ledgerBalanced: true, hostedCertified: false }).decision).toBe("BLOCKED");
 });
});
