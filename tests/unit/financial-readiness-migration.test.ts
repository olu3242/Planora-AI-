import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const sql = readFileSync(resolve("prisma/migrations/20261016000300_financial_readiness_snapshots/migration.sql"), "utf8");
describe("readiness migration static security contract", () => {
  it("ties assessments to real legal entities", () => {
    expect(sql).toMatch(/"legalEntityId" UUID NOT NULL REFERENCES "LegalEntity"\("id"\)/);
  });
  it("references the existing FiscalPeriod UUID", () => {
    expect(sql).toMatch(/"periodId" UUID NOT NULL REFERENCES "FiscalPeriod"\\("id"\\)/);
  });
  it("forces RLS on both readiness tables", () => {
    for (const table of ["FinancialReadinessAssessment", "FinancialReadinessEvidence"]) {
      expect(sql).toContain(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      expect(sql).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
    }
  });
  it("does not allow update or delete policies", () => {
    expect(sql).not.toMatch(/CREATE POLICY[^;]+FOR (UPDATE|DELETE)/is);
  });
  it("requires organization-scoped foreign key on evidence", () => {
    expect(sql).toContain('FOREIGN KEY ("assessmentId","organizationId")');
  });
});
