import { describe, expect, it } from "vitest";
import { MAX_CLEANUP_ROWS, validateCleanupRowCount } from "@/domain/accounting/bookkeeping-cleanup-request-limit";
describe("cleanup row count", () => {
 it("allows the maximum", () => expect(validateCleanupRowCount(MAX_CLEANUP_ROWS)).toBe(MAX_CLEANUP_ROWS));
 it("rejects over limit", () => expect(() => validateCleanupRowCount(MAX_CLEANUP_ROWS+1)).toThrow());
 it("rejects negative", () => expect(() => validateCleanupRowCount(-1)).toThrow());
});
