import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const workflow = readFileSync(".github/workflows/financial-readiness-certification.yml", "utf8");
describe("bookkeeping certification workflow coverage", () => {
  it("includes reconciliation source changes in push and pull request triggers", () => {
    expect(workflow.match(/src\/lib\/accounting\/bookkeeping-reconciliation\*/g)?.length).toBe(2);
  });
  it("includes all three cleanup tables in PostgreSQL RLS checks", () => {
    for (const table of ["BookkeepingCleanupCase", "BookkeepingCleanupJob", "BookkeepingCleanupOutbox"]) {
      expect(workflow).toContain(table);
    }
  });
  it("requires all five accounting security tables", () => {
    expect(workflow).toContain("rows.length !== 5");
  });
});
