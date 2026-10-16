import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const sql = readFileSync(resolve("prisma/migrations/20261016000400_bookkeeping_cleanup_cases/migration.sql"), "utf8");
describe("bookkeeping cleanup persistence migration contract", () => {
  it("enforces tenant RLS including FORCE", () => {
    expect(sql).toContain('ALTER TABLE "BookkeepingCleanupCase" ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE "BookkeepingCleanupCase" FORCE ROW LEVEL SECURITY');
  });
  it("requires fiscal period and legal entity foreign keys", () => {
    expect(sql).toContain('REFERENCES "FiscalPeriod"("id")');
    expect(sql).toContain('REFERENCES "LegalEntity"("id")');
  });
  it("does not permit delete policies", () => {
    expect(sql).not.toMatch(/CREATE POLICY[^;]+FOR DELETE/is);
  });
  it("enforces case uniqueness and revision constraints", () => {
    expect(sql).toContain('UNIQUE ("organizationId","legalEntityId","fiscalPeriodId","issueKey")');
    expect(sql).toContain('CHECK ("revision" >= 0)');
  });
});
