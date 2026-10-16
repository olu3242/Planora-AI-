import { describe, expect, it } from "vitest";
import { cleanupImportJobKey } from "../../src/lib/accounting/bookkeeping-cleanup-import-key";
const a = "11111111-1111-4111-8111-111111111111";
const b = "22222222-2222-4222-8222-222222222222";
const c = "33333333-3333-4333-8333-333333333333";
describe("event-driven cleanup job idempotency", () => {
  it("produces a stable key for retries of the same import", () => {
    expect(cleanupImportJobKey(a, b, c)).toBe(cleanupImportJobKey(a, b, c));
  });
  it("creates distinct keys for separate imports", () => {
    expect(cleanupImportJobKey(a, b, c)).not.toBe(cleanupImportJobKey(a, b, a));
  });
  it("keeps legal entity and fiscal period in job identity", () => {
    expect(cleanupImportJobKey(a, b, c)).not.toBe(cleanupImportJobKey(b, a, c));
  });
  it("rejects untrusted non-UUID event identifiers", () => {
    expect(() => cleanupImportJobKey(a, b, "../event")).toThrow("INVALID_CLEANUP_IMPORT_EVENT");
  });
});
