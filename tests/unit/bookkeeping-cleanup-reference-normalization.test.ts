import { describe, expect, it } from "vitest";
import { proposeBookkeepingCleanup } from "@/domain/accounting/bookkeeping-cleanup";
describe("cleanup reference normalization",()=>{it("detects equivalent reference strings",()=>{const a={id:"x",organizationId:"o",date:"2026-10-19",amountMinor:10,currency:"NGN",description:"one",reference:" INV-7 "};expect(proposeBookkeepingCleanup([a,{...a,id:"y",description:"two",reference:"inv-7"}])[0]?.kind).toBe("DUPLICATE_CANDIDATE");});});
