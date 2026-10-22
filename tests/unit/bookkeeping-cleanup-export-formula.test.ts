import { describe, expect, it } from "vitest";
import { cleanupFindingsCsv } from "@/domain/accounting/bookkeeping-cleanup-export";
describe("cleanup CSV formula safety", () => {
 it.each(["=SUM(1,2)", "+cmd", "-1+2", "@SUM(1)"])("escapes formula prefix %s", reason => {
  const csv = cleanupFindingsCsv([{ transactionId: "a", kind: "INVALID_INPUT", reason, requiresReview: true }]);
  expect(csv).toContain("'"+reason);
 });
});
