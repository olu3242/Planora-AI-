import { describe, expect, it } from "vitest";
import { cleanupFindingsCsv } from "@/domain/accounting/bookkeeping-cleanup-export";
describe("cleanup empty export", () => {
 it("includes only header when no findings exist", () => expect(cleanupFindingsCsv([]).split("\r\n")).toHaveLength(1));
});
