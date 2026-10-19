import { describe, expect, it } from "vitest";
import { proposeBookkeepingCleanup } from "@/domain/accounting/bookkeeping-cleanup";
describe("cleanup guard regressions", () => {
  const row = { id: "a", organizationId: "tenant", date: "2026-10-18", amountMinor: 500, currency: "NGN", description: "Cash purchase" };
  it("rejects a repeated transaction identifier", () => {
    expect(proposeBookkeepingCleanup([row, row]).map(f => f.kind)).toEqual(["INVALID_INPUT"]);
  });
  it("keeps positive and negative amounts distinct", () => {
    expect(proposeBookkeepingCleanup([row, { ...row, id: "b", amountMinor: -500 }])).toEqual([]);
  });
  it("does not flag distinct references as duplicates", () => {
    expect(proposeBookkeepingCleanup([{ ...row, reference: "INV-1" }, { ...row, id: "b", reference: "INV-2" }])).toEqual([]);
  });
  it("rejects invalid calendar dates", () => {
    expect(proposeBookkeepingCleanup([{ ...row, date: "2026-02-29" }])[0].kind).toBe("INVALID_INPUT");
  });
});
