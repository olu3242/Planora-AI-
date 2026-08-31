import { describe, expect, it } from "vitest";
import { hasPermission } from "@/permissions/permissions";

describe("permission evaluation", () => {
  it("allows CFO publication", () => expect(hasPermission("CFO", "forecast.publish")).toBe(true));
  it("allows analysts to submit but not approve", () => { expect(hasPermission("ANALYST", "forecast.submit")).toBe(true); expect(hasPermission("ANALYST", "forecast.approve")).toBe(false); });
  it("prevents directors from tenant administration", () => expect(hasPermission("FPA_DIRECTOR", "admin.manage")).toBe(false));
});
