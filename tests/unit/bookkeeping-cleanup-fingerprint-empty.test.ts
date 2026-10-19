import { describe, expect, it } from "vitest";
import { cleanupBatchFingerprint } from "@/domain/accounting/bookkeeping-cleanup-fingerprint";
describe("cleanup empty fingerprint", () => {
 it("returns a SHA-256 digest for an empty batch", () => expect(cleanupBatchFingerprint([])).toMatch(/^[0-9a-f]{64}$/));
});
