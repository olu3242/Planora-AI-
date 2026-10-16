import { describe, expect, it } from "vitest";
import { assertMappingAccess, mappingRolesFor } from "../../src/lib/accounting/ai-mapping-access";

describe("mapping authorization against Planora roles", () => {
  it("allows CFO review under existing mapping.approve permission", () => {
    expect(assertMappingAccess("CFO", "review")).toContain("CONTROLLER");
  });
  it("does not allow analyst approval", () => {
    expect(() => assertMappingAccess("ANALYST", "review")).toThrow("FORBIDDEN_MAPPING_ACCESS");
  });
  it("allows analyst read in bookkeeping scope", () => {
    expect(assertMappingAccess("ANALYST", "read")).toEqual(["BOOKKEEPER"]);
  });
  it("does not silently elevate platform administrator to finance reviewer", () => {
    expect(mappingRolesFor("PLATFORM_ADMIN")).toEqual([]);
    expect(() => assertMappingAccess("PLATFORM_ADMIN", "read")).toThrow("FORBIDDEN_MAPPING_ACCESS");
  });
  it("maps FP&A director to accounting review scope", () => {
    expect(assertMappingAccess("FPA_DIRECTOR", "review")).toEqual(["ACCOUNTANT"]);
  });
});
