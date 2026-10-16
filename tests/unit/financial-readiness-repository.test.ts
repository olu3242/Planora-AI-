import { describe, expect, it, vi } from "vitest";
import { saveReadinessSnapshot } from "../../src/lib/accounting/financial-readiness-repository";
import type { ReadinessDimension, ReadinessEvidence } from "../../src/lib/accounting/financial-readiness";
const org = "11111111-1111-4111-8111-111111111111";
const scope = { organizationId: org, legalEntityId: "22222222-2222-4222-8222-222222222222", periodId: "44444444-4444-4444-8444-444444444444", asOf: "2026-10-16T12:00:00Z" };
const dimensions: ReadinessDimension[] = ["DATA_COMPLETENESS", "BOOKKEEPING_INTEGRITY", "RECONCILIATION", "ACCOUNTING_CONTROLS", "CLOSE_READINESS", "REPORTING_READINESS"];
const checks: ReadinessEvidence[] = dimensions.map((dimension,i) => ({
  id: "id"+i, ...scope, dimension, checkId: "check"+i, status: "PASS",
  weight: 1, material: true, sourceEvidenceIds: ["source"+i],
  verifiedAt: "2026-10-16T11:00:00Z", ownerRole: "CONTROLLER",
}));
function fixture() {
  const events: string[] = [];
  const tx = {
    $queryRaw: vi.fn(async () => { events.push("tenant-context"); return []; }),
    legalEntity: { findFirst: vi.fn(async () => { events.push("entity-scope"); return { organizationId: org, active: true }; }) },
    fiscalPeriod: { findUnique: vi.fn(async () => { events.push("period-scope"); return { year: { calendar: { organizationId: org } } }; }) },
    financialReadinessAssessment: { create: vi.fn(async () => { events.push("assessment"); return { id: "assessment1" }; }) },
    financialReadinessEvidence: { createMany: vi.fn(async () => { events.push("evidence"); return {}; }) },
  };
  const db = { $transaction: async <T>(fn: (arg: typeof tx) => Promise<T>) => fn(tx) };
  return { db, tx, events };
}
describe("financial readiness immutable snapshot contract", () => {
  it("stores evidence after assessment under one tenant transaction", async () => {
    const f = fixture();
    const result = await saveReadinessSnapshot(f.db, org, { scope, checks, policyVersion: "v1", sourceFingerprint: "sha256" });
    expect(result).toMatchObject({ score: 100, status: "CANDIDATE_FOR_APPROVAL" });
    expect(f.events).toEqual(["tenant-context", "entity-scope", "period-scope", "assessment", "evidence"]);
  });
  it("rejects foreign tenant before DB transaction", async () => {
    const f = fixture();
    await expect(saveReadinessSnapshot(f.db, "33333333-3333-4333-8333-333333333333", { scope, checks, policyVersion: "v1", sourceFingerprint: "sha256" })).rejects.toThrow("TENANT_MISMATCH");
    expect(f.events).toEqual([]);
  });
  it("requires versioned source fingerprint", async () => {
    const f = fixture();
    await expect(saveReadinessSnapshot(f.db, org, { scope, checks, policyVersion: "v1", sourceFingerprint: "" })).rejects.toThrow("READINESS_VERSION_REQUIRED");
  });
});
