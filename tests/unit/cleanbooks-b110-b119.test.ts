import {describe,it,expect} from "vitest";
import {profileTransactions} from "../../src/lib/cleanbooks/profile-transactions";
import {findDuplicateCandidates} from "../../src/lib/cleanbooks/duplicate-candidates";
import {scanReadiness} from "../../src/lib/cleanbooks/b101-scan-readiness";
const scope={organizationId:"org",legalEntityId:"entity"};
const base={id:"1",...scope,sourceAccountId:"bank",currency:"USD",amountMinor:100,bookedAt:"2026-10-15",description:"invoice",accountId:null};
describe("CleanBooks B110-B119 fail-closed contracts",()=>{
 it("B113 malformed date types are profile exceptions",()=>expect(profileTransactions([{...base,bookedAt:null as unknown as string}],scope).exceptions.some(x=>x.code==="INVALID_DATE")).toBe(true));
 it("B114 malformed duplicate date is skipped",()=>expect(findDuplicateCandidates([{...base,bookedAt:undefined as unknown as string},{...base,id:"2",bookedAt:undefined as unknown as string}],scope)).toHaveLength(0));
 it("B115 cross-entity duplicate candidates throw",()=>expect(()=>findDuplicateCandidates([{...base,organizationId:"other"}],scope)).toThrow("CLEANBOOKS_CROSS_SCOPE"));
 it("B116 different source accounts do not match",()=>expect(findDuplicateCandidates([base,{...base,id:"2",sourceAccountId:"other"}],scope)).toHaveLength(0));
 it("B117 matching source references require review",()=>expect(findDuplicateCandidates([{...base,sourceReference:"r"},{...base,id:"2",sourceReference:"r"}],scope)[0].decision).toBe("REVIEW_REQUIRED"));
 it("B118 incomplete coverage never reaches ready state",()=>expect(scanReadiness({coverageComplete:false,accountCount:1,transactionCount:1}).status).toBe("INCOMPLETE"));
 it("B119 no financial posting is authorized",()=>expect(profileTransactions([base],scope).canPost).toBe(false));
});
