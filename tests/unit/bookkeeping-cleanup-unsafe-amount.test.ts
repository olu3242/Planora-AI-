import { describe, expect, it } from "vitest";
import { proposeBookkeepingCleanup } from "@/domain/accounting/bookkeeping-cleanup";
describe("cleanup safe amounts",()=>{it("rejects unsafe integers",()=>{const row={id:"x",organizationId:"o",date:"2026-10-19",amountMinor:Number.MAX_SAFE_INTEGER+1,currency:"NGN",description:"valid"};expect(proposeBookkeepingCleanup([row])[0]?.kind).toBe("INVALID_INPUT");});});
