import { describe, expect, it } from "vitest";
import { cleanupRequestIdentity } from "@/domain/accounting/bookkeeping-cleanup-idempotency";
describe("cleanup idempotency batch", () => {
 it("rejects a blank batch ID", () => expect(() => cleanupRequestIdentity("  ", [])).toThrow());
 it("normalizes surrounding whitespace in batch IDs", () => expect(cleanupRequestIdentity("  batch-1  ", []).batchId).toBe("batch-1"));
});
