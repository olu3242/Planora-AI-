import { describe, expect, it } from "vitest";
import { projectReadinessSnapshot, type StoredReadinessAssessment } from "../../src/lib/accounting/financial-readiness-read-model";

const names = ["DATA_COMPLETENESS","BOOKKEEPING_INTEGRITY","RECONCILIATION","ACCOUNTING_CONTROLS","CLOSE_READINESS","REPORTING_READINESS"];
function fixture(): StoredReadinessAssessment {
  return {
    id: "assessment", organizationId: "org", legalEntityId: "entity", periodId: "2026-10",
    asOf: new Date("2026-10-16T12:00:00Z"), createdAt: new Date("2026-10-16T12:00:01Z"),
    score: 75, status: "BLOCKED", blockers: ["MATERIAL_RECONCILIATION"],
    actions: [{ checkId: "RECONCILIATION:BANK", reason: "FAILED", ownerRole: "ACCOUNTANT" }],
    dimensions: Object.fromEntries(names.map(name => [name, { score: 75, checks: 1 }])),
    policyVersion: "v1", sourceFingerprint: "fingerprint",
  };
}
describe("financial readiness read projection", () => {
  it("projects a valid persisted assessment with disclaimer", () => {
    const output = projectReadinessSnapshot(fixture(), "org");
    expect(output).toMatchObject({ score: 75, status: "BLOCKED", assessmentId: "assessment" });
    expect(output.disclaimer).toContain("not an audit opinion");
  });
  it("rejects cross-tenant reads", () => {
    expect(() => projectReadinessSnapshot(fixture(), "other")).toThrow("TENANT_MISMATCH");
  });
  it("rejects malformed scores", () => {
    expect(() => projectReadinessSnapshot({ ...fixture(), score: 101 }, "org")).toThrow("INVALID_READINESS_SNAPSHOT");
  });
  it("rejects missing dimensions", () => {
    expect(() => projectReadinessSnapshot({ ...fixture(), dimensions: {} }, "org")).toThrow("INVALID_READINESS_SNAPSHOT");
  });
  it("rejects malformed action payloads", () => {
    expect(() => projectReadinessSnapshot({ ...fixture(), actions: [{ checkId: "x" }] }, "org")).toThrow("INVALID_READINESS_SNAPSHOT");
  });
});
