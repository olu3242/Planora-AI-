import { describe, expect, it } from "vitest";
import { parseCleanupPageLimit } from "@/domain/accounting/bookkeeping-cleanup-pagination";
describe("cleanup pagination bounds", () => {
 it("accepts the lower bound", () => expect(parseCleanupPageLimit("1")).toBe(1));
 it("rejects empty input", () => expect(() => parseCleanupPageLimit("")).toThrow());
});
