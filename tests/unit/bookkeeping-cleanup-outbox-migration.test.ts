import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const sql = readFileSync("prisma/migrations/20261016000600_bookkeeping_cleanup_outbox/migration.sql", "utf8");
describe("bookkeeping cleanup outbox database invariants", () => {
  it("forces tenant row security", () => {
    expect(sql).toContain('ALTER TABLE "BookkeepingCleanupOutbox" ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE "BookkeepingCleanupOutbox" FORCE ROW LEVEL SECURITY');
  });
  it("deduplicates import event identity per tenant", () => {
    expect(sql).toContain('UNIQUE ("organizationId","importEventId")');
  });
  it("allows only pending and delivered states", () => {
    expect(sql).toContain("('PENDING','DELIVERED')");
  });
  it("contains no deletion policy", () => {
    expect(sql).not.toMatch(/CREATE POLICY[^;]+FOR DELETE/is);
  });
});
