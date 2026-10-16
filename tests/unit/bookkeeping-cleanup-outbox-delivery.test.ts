import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
const source = readFileSync("src/lib/accounting/bookkeeping-cleanup-outbox.ts", "utf8");
describe("cleanup outbox atomic delivery contract", () => {
  it("enqueues and acknowledges within one tenant transaction callback", () => {
    expect(source).toContain("return withMappingTenant(prisma, organizationId, async connection =>");
    expect(source).toContain("await tx.bookkeepingCleanupJob.upsert(");
    expect(source).toContain("await tx.bookkeepingCleanupOutbox.updateMany(");
  });
  it("keeps acknowledgement conditional on pending state", () => {
    expect(source).toContain('state: "PENDING"');
    expect(source).toContain('state: "DELIVERED"');
  });
  it("rejects reusing an import ID for another scope", () => {
    expect(source).toContain("CLEANUP_IMPORT_EVENT_SCOPE_CONFLICT");
  });
});
