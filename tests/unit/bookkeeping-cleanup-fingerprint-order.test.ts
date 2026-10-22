import { describe, expect, it } from "vitest";
import { cleanupBatchFingerprint } from "@/domain/accounting/bookkeeping-cleanup-fingerprint";
const a={id:"a",organizationId:"o",date:"2026-10-18",amountMinor:1,currency:"NGN",description:"food"};
describe("cleanup fingerprint order", () => {
 it("captures transaction ordering", () => expect(cleanupBatchFingerprint([a,{...a,id:"b"}])).not.toBe(cleanupBatchFingerprint([{...a,id:"b"},a])));
});
