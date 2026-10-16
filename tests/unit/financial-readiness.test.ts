import { describe, expect, it } from "vitest";
import { evaluateFinancialReadiness, closeReadinessEvidence, mappingReadinessEvidence, fpaReadinessBlockers, type ReadinessDimension, type ReadinessEvidence } from "../../src/lib/accounting/financial-readiness";
import { startClose } from "../../src/domain/accounting/close-os";
const scope = { organizationId: "o1", legalEntityId: "e1", periodId: "p1", asOf: "2026-10-16T12:00:00Z" };
const dims: ReadinessDimension[] = ["DATA_COMPLETENESS", "BOOKKEEPING_INTEGRITY", "RECONCILIATION", "ACCOUNTING_CONTROLS", "CLOSE_READINESS", "REPORTING_READINESS"];
function checks(): ReadinessEvidence[] {
  return dims.map((dimension, i) => ({
    id: "e" + i, ...scope, dimension, checkId: "check-" + i,
    status: "PASS", weight: 1, material: true, sourceEvidenceIds: ["source-" + i],
    verifiedAt: "2026-10-16T11:00:00Z", ownerRole: "CONTROLLER",
  }));
}
describe("financial readiness", () => {
  it("returns candidate status only when all six dimensions are evidenced", () => {
    expect(evaluateFinancialReadiness(scope, checks())).toMatchObject({ score: 100, status: "CANDIDATE_FOR_APPROVAL", blockers: [] });
  });
  it("never clears a material failed control with high scores", () => {
    const items = checks();
    items[2] = { ...items[2], status: "FAIL" };
    expect(evaluateFinancialReadiness(scope, items)).toMatchObject({ status: "BLOCKED" });
  });
  it("fails closed when a dimension is missing", () => {
    expect(evaluateFinancialReadiness(scope, checks().slice(1))).toMatchObject({ score: null, status: "BLOCKED" });
  });
  it("does not credit expired evidence", () => {
    const items = checks();
    items[0] = { ...items[0], expiresAt: "2026-10-15T00:00:00Z" };
    expect(evaluateFinancialReadiness(scope, items).score).toBeLessThan(100);
  });
  it("rejects foreign tenant evidence", () => {
    const items = checks();
    items[0] = { ...items[0], organizationId: "other" };
    expect(() => evaluateFinancialReadiness(scope, items)).toThrow("READINESS_SCOPE_MISMATCH");
  });
  it("rejects duplicate control keys", () => {
    expect(() => evaluateFinancialReadiness(scope, [...checks(), checks()[0]])).toThrow("INVALID_READINESS_CHECK");
  });
  it("treats unreviewed AI mapping as unknown regardless of model confidence", () => {
    expect(mappingReadinessEvidence([{
      tenantId: "o1", transactionId: "t1", sourceHash: "h1", accountId: "a1", confidence: 1,
      explanation: "AI", evidenceIds: ["doc"], agent: "BOOKKEEPING", route: "AUTO_PREPARE",
      status: "PROPOSED", modelVersion: "m1", policyVersion: "p1", idempotencyKey: "key",
    }], scope).status).toBe("UNKNOWN");
  });
  it("inherits close prerequisites from the existing close engine", () => {
    const run = startClose({ organizationId: "o1", legalEntityId: "e1", periodId: "p1", preparedBy: "u1",
      tasks: [{ id: "BANK_RECONCILIATION", status: "BLOCKED" }],
      dependencies: { C_WAVE: "PASS", D_WAVE: "PASS", E_WAVE: "PASS" } });
    expect(closeReadinessEvidence(run, scope)[0].status).toBe("FAIL");
  });
  it("propagates FP&A convergence blockers", () => {
    expect(fpaReadinessBlockers({ actuals: [], staleKeys: [], variances: [], status: "BLOCKED", blockers: ["STALE_ACTUALS_PRESENT"] })).toContain("FPA_STALE_ACTUALS_PRESENT");
  });
});
