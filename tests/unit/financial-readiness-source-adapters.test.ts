import { describe, expect, it } from "vitest";
import { assessReadinessSources, buildReadinessEvidence, type ReadinessSourceBundle } from "../../src/lib/accounting/financial-readiness-source-adapters";
import { startClose } from "../../src/domain/accounting/close-os";

const scope = { organizationId: "org", legalEntityId: "entity", periodId: "period", asOf: "2026-10-16T12:00:00Z" };
const pass = (id: string) => ({ id, status: "PASS" as const, evidenceIds: [id + ":evidence"], verifiedAt: "2026-10-16T11:00:00Z", material: true, weight: 1 });
function fixture(): ReadinessSourceBundle {
  return {
    scope, completeness: [pass("ingestion")], bookkeeping: [pass("journal")],
    reconciliation: [pass("bank")], accountingControls: [pass("posting")],
    reporting: [pass("statements")], fpa: null, fpaScopeVerified: false,
    closeRun: startClose({
      organizationId: scope.organizationId, legalEntityId: scope.legalEntityId,
      periodId: scope.periodId, preparedBy: "bookkeeper",
      dependencies: { C_WAVE: "PASS", D_WAVE: "PASS", E_WAVE: "PASS" },
      tasks: [{ id: "BANK_RECONCILIATION", status: "COMPLETE", evidence: "bank-evidence" }],
    }),
  };
}
describe("financial readiness source harmonization", () => {
  it("accepts evidenced controls and certified close prerequisites as candidate", () => {
    expect(assessReadinessSources(fixture())).toMatchObject({ score: 100, status: "CANDIDATE_FOR_APPROVAL" });
  });
  it("never treats absent close run as passed", () => {
    const b = fixture();
    expect(assessReadinessSources({ ...b, closeRun: null })).toMatchObject({ score: null, status: "BLOCKED" });
  });
  it("never treats missing reconciliation as passed", () => {
    const b = fixture();
    expect(assessReadinessSources({ ...b, reconciliation: [] })).toMatchObject({ score: null, status: "BLOCKED" });
  });
  it("preserves material accounting control failures", () => {
    const b = fixture();
    expect(assessReadinessSources({ ...b, accountingControls: [{ ...pass("posting"), status: "FAIL" }] }).status).toBe("BLOCKED");
  });
  it("rejects close evidence from another organization", () => {
    const b = fixture();
    expect(() => buildReadinessEvidence({ ...b, closeRun: { ...b.closeRun!, organizationId: "other" } })).toThrow("READINESS_SCOPE_MISMATCH");
  });
  it("does not treat FP&A PASS without actual source keys as verified reporting", () => {
    const b = fixture();
    const fpa = { status: "PASS" as const, blockers: [], staleKeys: [], actuals: [], variances: [] };
    const result = assessReadinessSources({ ...b, fpa, fpaScopeVerified: true });
    expect(result.status).toBe("BLOCKED");
  });
  it("blocks stale FP&A actuals even when other checks pass", () => {
    const b = fixture();
    const fpa = { status: "BLOCKED" as const, blockers: ["STALE_ACTUALS_PRESENT"], staleKeys: ["key"], actuals: [{ grainKey: "g", accountId: "a", amountMinor: 1n, sourceKey: "ledger" }], variances: [] };
    expect(assessReadinessSources({ ...b, fpa, fpaScopeVerified: true }).status).toBe("BLOCKED");
  });
});
