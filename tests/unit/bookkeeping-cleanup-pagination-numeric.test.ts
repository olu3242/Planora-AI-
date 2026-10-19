import { describe, expect, it } from "vitest";
import { parseCleanupPageLimit } from "@/domain/accounting/bookkeeping-cleanup-pagination";
describe("cleanup numeric pagination", () => {
 it("rejects whitespace", () => expect(() => parseCleanupPageLimit(" 5 ")).toThrow());
 it("rejects decimal syntax", () => expect(() => parseCleanupPageLimit("5.0")).toThrow());
});
