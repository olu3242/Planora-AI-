import { describe, expect, it } from "vitest";
import { cleanupRequestIdentity } from "@/domain/accounting/bookkeeping-cleanup-idempotency";
describe("cleanup request identity", () => {
 it("captures batch id and deterministic input", () => {
  const a = cleanupRequestIdentity(" batch ", []);
  expect(a.batchId).toBe("batch");
  expect(a.fingerprint).toMatch(/^[a-f0-9]{64}$/);
 });
});
