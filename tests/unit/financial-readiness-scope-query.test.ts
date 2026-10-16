import { describe, expect, it, vi } from "vitest";
import { verifyReadinessScopeInTransaction } from "../../src/lib/accounting/financial-readiness-scope-query";
const organizationId = "11111111-1111-4111-8111-111111111111";
const legalEntityId = "22222222-2222-4222-8222-222222222222";
const periodId = "33333333-3333-4333-8333-333333333333";
function fixture(entityOrg = organizationId, calendarOrg = organizationId) {
  return {
    legalEntity: { findFirst: vi.fn(async () => ({ organizationId: entityOrg, active: true })) },
    fiscalPeriod: { findUnique: vi.fn(async () => ({ year: { calendar: { organizationId: calendarOrg } } })) },
  };
}
describe("readiness transactional scope verifier", () => {
  it("accepts matching entity and calendar", async () => {
    await expect(verifyReadinessScopeInTransaction(fixture(), organizationId, legalEntityId, periodId)).resolves.toBeUndefined();
  });
  it("rejects a foreign legal entity", async () => {
    await expect(verifyReadinessScopeInTransaction(fixture("other"), organizationId, legalEntityId, periodId)).rejects.toThrow("READINESS_SCOPE_NOT_FOUND");
  });
  it("rejects a foreign fiscal calendar", async () => {
    await expect(verifyReadinessScopeInTransaction(fixture(organizationId, "other"), organizationId, legalEntityId, periodId)).rejects.toThrow("READINESS_SCOPE_NOT_FOUND");
  });
  it("rejects invalid UUIDs before queries", async () => {
    const db = fixture();
    await expect(verifyReadinessScopeInTransaction(db, organizationId, legalEntityId, "p1")).rejects.toThrow("INVALID_READINESS_SCOPE");
    expect(db.legalEntity.findFirst).not.toHaveBeenCalled();
  });
});
