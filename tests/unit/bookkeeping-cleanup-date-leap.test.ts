import { describe, expect, it } from "vitest";
import { proposeBookkeepingCleanup } from "@/domain/accounting/bookkeeping-cleanup";
const row={id:"x",organizationId:"o",date:"2024-02-29",amountMinor:1,currency:"NGN",description:"valid"};
describe("cleanup leap dates",()=>{it("accepts valid leap day",()=>expect(proposeBookkeepingCleanup([row])).toEqual([]));it("rejects non-leap day",()=>expect(proposeBookkeepingCleanup([{...row,date:"2025-02-29"}])[0]?.kind).toBe("INVALID_INPUT"));});
