import { describe, expect, it } from "vitest";
import { hasPermission } from "@/permissions/permissions";

describe("permission evaluation", () => {
  it("allows CFO publication without platform administration", () => {
    expect(hasPermission("CFO", "forecast.publish")).toBe(true);
    expect(hasPermission("CFO", "reporting.approve")).toBe(true);
    expect(hasPermission("CFO", "reporting.publish")).toBe(true);
    expect(hasPermission("CFO", "admin.manage")).toBe(false);
  });
  it("allows analysts to prepare reports but not review, approve, or publish", () => {
    expect(hasPermission("ANALYST", "reporting.prepare")).toBe(true);
    expect(hasPermission("ANALYST", "reporting.review")).toBe(false);
    expect(hasPermission("ANALYST", "reporting.approve")).toBe(false);
    expect(hasPermission("ANALYST", "reporting.publish")).toBe(false);
  });
  it("allows FP&A directors to review reports but not approve or publish them", () => {
    expect(hasPermission("FPA_DIRECTOR", "reporting.review")).toBe(true);
    expect(hasPermission("FPA_DIRECTOR", "reporting.approve")).toBe(false);
    expect(hasPermission("FPA_DIRECTOR", "reporting.publish")).toBe(false);
    expect(hasPermission("FPA_DIRECTOR", "admin.manage")).toBe(false);
  });
  it("gives platform admin operational authority without financial reporting authority", () => {
    expect(hasPermission("PLATFORM_ADMIN", "admin.manage")).toBe(true);
    expect(hasPermission("PLATFORM_ADMIN", "financial.read")).toBe(false);
    expect(hasPermission("PLATFORM_ADMIN", "reporting.prepare")).toBe(false);
    expect(hasPermission("PLATFORM_ADMIN", "reporting.approve")).toBe(false);
    expect(hasPermission("PLATFORM_ADMIN", "reporting.publish")).toBe(false);
  });
});
