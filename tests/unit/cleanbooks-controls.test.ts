import {describe,it,expect} from "vitest";
import {proposeReconciliation} from "../../src/lib/cleanbooks/reconciliation";
import {investigateSuspense} from "../../src/lib/cleanbooks/suspense";
import {inspectOpenItems} from "../../src/lib/cleanbooks/receivables";
import {draftCorrection} from "../../src/lib/cleanbooks/corrections";
import {checkLedgerIntegrity} from "../../src/lib/cleanbooks/integrity";
import {summarizeCleanBooks} from "../../src/lib/cleanbooks/dashboard";
const scope={organizationId:"o",legalEntityId:"e"};
describe("CleanBooks B4-B9 financial controls",()=>{
 it("flags suspense in locked periods",()=>expect(investigateSuspense([{id:"s",...scope,accountId:"susp",amountMinor:500,periodLocked:true}],["susp"],scope)[0].reason).toBe("LOCKED_PERIOD"));
 it("matches only unique posted unlocked journal candidates",()=>{
  const bank={id:"b",...scope,currency:"USD",amountMinor:100,bookedAt:"2026-10-15",reference:"abc"};
  const journal={...bank,id:"j",posted:true,locked:false};
  expect(proposeReconciliation([bank],[journal],scope).matches[0].decision).toBe("REVIEW_REQUIRED");
  expect(proposeReconciliation([bank],[journal,{...journal,id:"j2"}],scope).matches).toHaveLength(0);
 });
 it("flags overdue open AP without settlement",()=>expect(inspectOpenItems([{id:"i",...scope,kind:"AP",dueDate:"2026-10-01",outstandingMinor:100,status:"OPEN"}],scope,"2026-10-15")[0].flag).toBe("OVERDUE"));
 it("rejects locked correction periods",()=>expect(()=>draftCorrection({...scope,fiscalPeriodId:"p",reason:"fix",periodLocked:true,lines:[]})).toThrow("PERIOD_LOCKED"));
 it("requires balanced corrections",()=>expect(()=>draftCorrection({...scope,fiscalPeriodId:"p",reason:"fix",periodLocked:false,lines:[{accountId:"a",debitMinor:100,creditMinor:0},{accountId:"b",debitMinor:0,creditMinor:99}]})).toThrow("UNBALANCED_JOURNAL"));
 it("flags unbalanced journal",()=>expect(checkLedgerIntegrity([{id:"l",...scope,journalId:"j",debitMinor:100,creditMinor:0}],scope).balanced).toBe(false));
 it("never marks cleanup dashboard as posting-authorized",()=>expect(summarizeCleanBooks({scanned:1,profileExceptions:0,duplicateCandidates:0,suspenseItems:0,reconciliationUnmatched:0,overdueItems:0,integrityExceptions:0,coverageComplete:true}).canPost).toBe(false));
});
