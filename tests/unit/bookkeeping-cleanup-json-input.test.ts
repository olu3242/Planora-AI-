import { describe, expect, it } from "vitest";
import { isCleanupJsonArray } from "@/domain/accounting/bookkeeping-cleanup-csv-parse";
describe("cleanup JSON input", () => {
 it("accepts a JSON array", () => expect(isCleanupJsonArray("[]")).toBe(true));
 it("rejects a JSON object", () => expect(isCleanupJsonArray("{}")).toBe(false));
 it("rejects malformed JSON", () => expect(isCleanupJsonArray("{")).toBe(false));
});
