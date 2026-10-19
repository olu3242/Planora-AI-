import { describe, expect, it } from "vitest";
import { parseCleanupPageLimit } from "@/domain/accounting/bookkeeping-cleanup-pagination";
describe("cleanup page limits", () => {
  it("defaults to 50", () => expect(parseCleanupPageLimit(null)).toBe(50));
  it("accepts 1-100", () => expect(parseCleanupPageLimit("100")).toBe(100));
  it.each(["0", "-1", "1.5", "NaN", "101", "01", "1e2"] )("rejects %s", value => expect(() => parseCleanupPageLimit(value)).toThrow());
});
