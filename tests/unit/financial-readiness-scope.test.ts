import { describe, expect, it } from "vitest";
import { assertReadinessScopeOwnership } from "../../src/lib/accounting/financial-readiness-scope";
const org = "org-1";
const entity = { organizationId: org, active: true };
const period = { year: { calendar: { organizationId: org } } };
describe("readiness fiscal scope isolation", () => {
  it("allows same-tenant entity and calendar", () => {
    expect(() => assertReadinessScopeOwnership({ organizationId: org, legalEntity: entity, fiscalPeriod: period })).not.toThrow();
  });
  it("rejects foreign legal entity", () => {
    expect(() => assertReadinessScopeOwnership({ organizationId: org, legalEntity: { ...entity, organizationId: "other" }, fiscalPeriod: period })).toThrow("READINESS_SCOPE_NOT_FOUND");
  });
  it("rejects foreign fiscal calendar", () => {
    expect(() => assertReadinessScopeOwnership({ organizationId: org, legalEntity: entity, fiscalPeriod: { year: { calendar: { organizationId: "other" } } } })).toThrow("READINESS_SCOPE_NOT_FOUND");
  });
  it("rejects inactive legal entity", () => {
    expect(() => assertReadinessScopeOwnership({ organizationId: org, legalEntity: { ...entity, active: false }, fiscalPeriod: period })).toThrow("READINESS_SCOPE_NOT_FOUND");
  });
  it("rejects missing fiscal period", () => {
    expect(() => assertReadinessScopeOwnership({ organizationId: org, legalEntity: entity, fiscalPeriod: null })).toThrow("READINESS_SCOPE_NOT_FOUND");
  });
});
