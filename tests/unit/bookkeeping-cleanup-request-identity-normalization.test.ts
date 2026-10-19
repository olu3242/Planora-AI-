import { describe, expect, it } from "vitest";
import { cleanupRequestIdentity } from "@/domain/accounting/bookkeeping-cleanup-idempotency";
describe("cleanup request identity normalization", () => {
 it("treats whitespace-padded batch identifiers consistently", () => {
  expect(cleanupRequestIdentity(" batch ", []).batchId).toBe(cleanupRequestIdentity("batch", []).batchId);
 });
});
