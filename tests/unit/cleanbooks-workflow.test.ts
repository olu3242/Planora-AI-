import { describe,expect,it } from "vitest";
import { profileTransactions } from "../../src/lib/cleanbooks/profile-transactions";
import { findDuplicateCandidates } from "../../src/lib/cleanbooks/duplicate-candidates";
import { proposeReconciliation } from "../../src/lib/cleanbooks/reconciliation";
import { draftCorrection } from "../../src/lib/cleanbooks/corrections";
import { summarizeCleanBooks } from "../../src/lib/cleanbooks/dashboard";
const scope={organizationId:"org",legalEntityId:"entity"};
describe("CleanBooks B1-B9 deterministic workflow contract",()=>{
 it("detects duplicate, blocks ambiguous matching and never posts",()=>{
  const row={id:"a",...scope,currency:"USD",amountMinor:100,bookedAt:"2026-10-15",description:"Bill",sourceReference:"same",accountId:null};
  const rows=[row,{...row,id:"b"}];
  const profile=profileTransactions(rows,scope);
  const duplicates=findDuplicateCandidates(rows,scope);
  const bank={id:"a",...scope,currency:"USD",amountMinor:100,bookedAt:"2026-10-15",reference:"Bill"};
  const journal={...bank,id:"j",posted:true,locked:false};
  const reconciliation=proposeReconciliation([bank],[journal,{...journal,id:"j2"}],scope);
  const dashboard=summarizeCleanBooks({scanned:profile.scanned,profileExceptions:profile.exceptions.length,duplicateCandidates:duplicates.length,suspenseItems:0,reconciliationUnmatched:reconciliation.unmatchedBankIds.length,overdueItems:0,integrityExceptions:0,coverageComplete:true});
  expect(duplicates).toHaveLength(1);
  expect(reconciliation.matches).toHaveLength(0);
  expect(dashboard.readiness).toBe("REVIEW_REQUIRED");
  expect(profile.canPost).toBe(false);
  expect(dashboard.canPost).toBe(false);
 });
 it("cannot draft a correction against a locked period",()=>expect(()=>draftCorrection({...scope,fiscalPeriodId:"p",reason:"cleanup",periodLocked:true,lines:[]})).toThrow("PERIOD_LOCKED"));
 it("never certifies incomplete scan coverage",()=>expect(summarizeCleanBooks({scanned:500,profileExceptions:0,duplicateCandidates:0,suspenseItems:0,reconciliationUnmatched:0,overdueItems:0,integrityExceptions:0,coverageComplete:false}).readiness).toBe("INCOMPLETE"));
});
