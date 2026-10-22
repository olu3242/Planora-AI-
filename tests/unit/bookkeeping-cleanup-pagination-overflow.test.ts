import { describe, expect, it } from "vitest";
import { parseCleanupPageLimit } from "@/domain/accounting/bookkeeping-cleanup-pagination";
describe("cleanup pagination overflow", () => {
 it("rejects unsafe integer strings", () => expect(() => parseCleanupPageLimit("9999999999999999999999999999")).toThrow());
});
