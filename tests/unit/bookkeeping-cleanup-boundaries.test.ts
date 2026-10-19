import { describe, expect, it } from "vitest";
import { proposeBookkeepingCleanup } from "@/domain/accounting/bookkeeping-cleanup";
describe("cleanup proposal boundaries", () => {
  it("handles empty input", () => expect(proposeBookkeepingCleanup([])).toEqual([]));
  it("flags missing description", () => expect(proposeBookkeepingCleanup([
    { id: "a", organizationId: "org", date: "2026-10-18", amountMinor: 1, currency: "NGN", description: " " },
  ])[0].kind).toBe("INVALID_INPUT"));
  it("does not mix currencies with identical numeric amounts", () => {
    const a = { id: "a", organizationId: "org", date: "2026-10-18", amountMinor: 1, currency: "NGN", description: "rent" };
    expect(proposeBookkeepingCleanup([a, { ...a, id: "b", currency: "USD" }])).toEqual([]);
  });
});
