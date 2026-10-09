import { describe, expect, it } from "vitest";
import { hasPermission } from "@/permissions/permissions";

describe("permission evaluation", () => {
  it("allows CFO publication without platform administration", () => {
    expect(hasPermission("CFO", "forecast.publish")).toBe(true);
    expect(hasPermission("CFO", "admin.manage")).toBe(false);
  });
  it("allows analysts to submit but not approve", () => { expect(hasPermission("ANALYST", "forecast.submit")).toBe(true); expect(hasPermission("ANALYST", "forecast.approve")).toBe(false); });
  it("prevents directors from tenant administration", () => expect(hasPermission("FPA_DIRECTOR", "admin.manage")).toBe(false));
  it("gives platform admin operational authority without financial authority", () => {
    expect(hasPermission("PLATFORM_ADMIN", "admin.manage")).toBe(true);
    expect(hasPermission("PLATFORM_ADMIN", "financial.read")).toBe(false);
    expect(hasPermission("PLATFORM_ADMIN", "forecast.approve")).toBe(false);
  });
});
