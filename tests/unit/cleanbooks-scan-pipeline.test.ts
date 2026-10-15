import {describe,expect,it} from "vitest";
import {assembleCleanBooksScan} from "../../src/lib/cleanbooks/scan-pipeline";
const scope={organizationId:"org",legalEntityId:"entity"};
const tx={id:"1",...scope,currency:"USD",amountMinor:100,bookedAt:"2026-10-15",description:"Office",sourceReference:"ref",sourceAccountId:"bank",accountId:null};
describe("CleanBooks scan pipeline contract",()=>{
 it("surfaces duplicate and incomplete coverage",()=>{
  const result=assembleCleanBooksScan([tx,{...tx,id:"2"}],scope,false);
  expect(result.duplicates).toHaveLength(1);
  expect(result.dashboard.readiness).toBe("INCOMPLETE");
  expect(result.canPost).toBe(false);
 });
 it("rejects foreign-entity input",()=>expect(()=>assembleCleanBooksScan([{...tx,legalEntityId:"other"}],scope,true)).toThrow("CLEANBOOKS_CROSS_SCOPE"));
 it("keeps review required for unassigned GL accounts",()=>expect(assembleCleanBooksScan([tx],scope,true).dashboard.readiness).toBe("REVIEW_REQUIRED"));
});
