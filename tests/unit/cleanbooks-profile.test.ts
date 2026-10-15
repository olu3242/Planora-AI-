import { describe, expect, it } from "vitest";
import { profileTransactions, type CleanupTransaction } from "../../src/lib/cleanbooks/profile-transactions";
const base: CleanupTransaction = {id:"a",organizationId:"org",legalEntityId:"entity",currency:"USD",amountMinor:1200,bookedAt:"2026-10-15",description:"Rent",sourceReference:"ref",accountId:"cash"};
const scan=(rows:CleanupTransaction[])=>profileTransactions(rows,{organizationId:"org",legalEntityId:"entity"});
describe("CleanBooks read-only transaction profiler",()=>{
 it("does not post",()=>expect(scan([base]).canPost).toBe(false));
 it("identifies exact duplicates",()=>expect(scan([base,{...base,id:"b"}]).exceptions).toContainEqual(expect.objectContaining({transactionId:"b",code:"POSSIBLE_DUPLICATE",relatedTransactionId:"a"})));
 it("does not conflate different currencies",()=>expect(scan([base,{...base,id:"b",currency:"EUR"}]).exceptions.some(x=>x.code==="POSSIBLE_DUPLICATE")).toBe(false));
 it("rejects out-of-scope data",()=>expect(scan([{...base,organizationId:"other"}]).exceptions).toContainEqual(expect.objectContaining({code:"CROSS_SCOPE"})));
 it("rejects fractional minor units",()=>expect(scan([{...base,amountMinor:1.5}]).exceptions).toContainEqual(expect.objectContaining({code:"INVALID_AMOUNT"})));
 it("rejects invalid calendar dates",()=>expect(scan([{...base,bookedAt:"2026-02-30"}]).exceptions).toContainEqual(expect.objectContaining({code:"INVALID_DATE"})));
 it("flags missing account and description",()=>expect(scan([{...base,accountId:null,description:" "}]).exceptions.map(x=>x.code)).toEqual(expect.arrayContaining(["MISSING_ACCOUNT","MISSING_DESCRIPTION"])));
});
