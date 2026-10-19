import { describe, expect, it } from "vitest";
import { cleanupRequestIdentity } from "@/domain/accounting/bookkeeping-cleanup-idempotency";
describe("cleanup replay identity", () => {
 it("keeps identical requests stable", () => expect(cleanupRequestIdentity("batch", [])).toEqual(cleanupRequestIdentity("batch", [])));
 it("keeps different batch IDs distinct", () => expect(cleanupRequestIdentity("a", []).batchId).not.toBe(cleanupRequestIdentity("b", []).batchId));
});
