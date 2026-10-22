import { describe, expect, it } from "vitest";
import { proposeBookkeepingCleanup } from "@/domain/accounting/bookkeeping-cleanup";
describe("cleanup normalization",()=>{it("detects whitespace and case normalized duplicates",()=>{const a={id:"x",organizationId:"o",date:"2026-10-19",amountMinor:10,currency:"NGN",description:" OFFICE  RENT "};expect(proposeBookkeepingCleanup([a,{...a,id:"y",description:"office rent"}])[0]?.kind).toBe("DUPLICATE_CANDIDATE");});});
