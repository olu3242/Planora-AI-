import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const sql = readFileSync("prisma/migrations/20261016000500_bookkeeping_cleanup_jobs/migration.sql", "utf8");
describe("durable bookkeeping cleanup job schema", () => {
  it("enforces tenant RLS", () => {
    expect(sql).toContain('ALTER TABLE "BookkeepingCleanupJob" ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE "BookkeepingCleanupJob" FORCE ROW LEVEL SECURITY');
  });
  it("deduplicates per organization", () => {
    expect(sql).toContain('UNIQUE ("organizationId","jobKey")');
  });
  it("requires leases only while running", () => {
    expect(sql).toContain('"status" = \'RUNNING\' AND "leaseToken" IS NOT NULL');
  });
  it("does not permit deletion policy", () => {
    expect(sql).not.toMatch(/CREATE POLICY[^;]+FOR DELETE/is);
  });
});
