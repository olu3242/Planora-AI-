import { describe, expect, it } from "vitest";
import { proposeBookkeepingCleanup } from "@/domain/accounting/bookkeeping-cleanup";
describe("cleanup tenant separation",()=>{it("does not match identical transactions across organizations",()=>{const a={id:"x",organizationId:"org-a",date:"2026-10-19",amountMinor:10,currency:"NGN",description:"same"};expect(proposeBookkeepingCleanup([a,{...a,id:"y",organizationId:"org-b"}])).toEqual([]);});});
