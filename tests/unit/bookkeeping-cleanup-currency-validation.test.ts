import { describe, expect, it } from "vitest";
import { proposeBookkeepingCleanup } from "@/domain/accounting/bookkeeping-cleanup";
describe("cleanup currency",()=>{it("rejects lowercase currency",()=>{const row={id:"x",organizationId:"o",date:"2026-10-19",amountMinor:1,currency:"ngn",description:"valid"};expect(proposeBookkeepingCleanup([row])[0]?.kind).toBe("INVALID_INPUT");});});
