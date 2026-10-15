import {describe,it,expect} from "vitest";
import {reviewPolicy} from "../../src/lib/cleanbooks/b64-review-policy";
import {accountCoverage} from "../../src/lib/cleanbooks/b65-account-coverage";
import {journalReference} from "../../src/lib/cleanbooks/b66-journal-reference";
import {unmatchedAging} from "../../src/lib/cleanbooks/b67-unmatched-aging";
import {scanRunEvidence} from "../../src/lib/cleanbooks/b68-run-evidence";
import {cleanupClosureGate} from "../../src/lib/cleanbooks/b69-closure-gate";
import {profileTransactions} from "../../src/lib/cleanbooks/profile-transactions";
describe("CleanBooks B60-B69 controls",()=>{
 it("handles missing description safely",()=>expect(profileTransactions([{id:"1",organizationId:"o",legalEntityId:"e",currency:"USD",amountMinor:1,bookedAt:"2026-10-15",description:undefined as unknown as string}],{organizationId:"o",legalEntityId:"e"}).exceptions.some(x=>x.code==="MISSING_DESCRIPTION")).toBe(true));
 it("prevents requester self-review",()=>expect(()=>reviewPolicy({actorId:"a",requesterId:"a",reviewerAuthorized:true,findingOpen:true})).toThrow());
 it("detects missing bank accounts",()=>expect(accountCoverage(["a","b"],["a"]).missing).toEqual(["b"]));
 it("requires journal source reference",()=>expect(()=>journalReference({organizationId:"o",legalEntityId:"e",journalId:"",sourceTransactionId:"t"})).toThrow());
 it("counts aged unmatched records",()=>expect(unmatchedAging([{id:"a",daysOld:100}]).over90).toBe(1));
 it("never asserts evidence verified",()=>expect(scanRunEvidence({runId:"r",correlationId:"c",organizationId:"o",legalEntityId:"e",scanned:1,complete:true}).verified).toBe(false));
 it("requires controller signoff",()=>expect(cleanupClosureGate({coverageComplete:true,allFindingsReviewed:true,independentApproval:true,ledgerBalanced:true,hostedCertified:true}).decision).toBe("CONTROLLER_SIGNOFF_REQUIRED"));
});
