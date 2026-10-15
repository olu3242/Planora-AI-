import { describe,expect,it } from "vitest";
import { findDuplicateCandidates } from "../../src/lib/cleanbooks/duplicate-candidates";
import type { CleanupTransaction } from "../../src/lib/cleanbooks/profile-transactions";
const base:CleanupTransaction={id:"a",organizationId:"o",legalEntityId:"e",currency:"USD",amountMinor:1200,bookedAt:"2026-10-15",description:"Vendor",sourceReference:"x"};
const scan=(rows:CleanupTransaction[])=>findDuplicateCandidates(rows,{organizationId:"o",legalEntityId:"e"});
describe("CleanBooks duplicate candidates",()=>{
 it("requires human review for identical references",()=>expect(scan([base,{...base,id:"b"}])).toContainEqual(expect.objectContaining({reason:"SAME_SOURCE_REFERENCE",decision:"REVIEW_REQUIRED"})));
 it("detects normalized content without source reference",()=>expect(scan([{...base,sourceReference:null},{...base,id:"b",sourceReference:null,description:" vendor "}])).toContainEqual(expect.objectContaining({reason:"SAME_DATE_AMOUNT_DESCRIPTION"})));
 it("does not match different currencies",()=>expect(scan([base,{...base,id:"b",currency:"EUR"}])).toHaveLength(0));
 it("fails closed on cross-tenant input",()=>expect(()=>scan([base,{...base,id:"b",organizationId:"other"}])).toThrow("CLEANBOOKS_CROSS_SCOPE"));
 it("does not match differing amounts",()=>expect(scan([base,{...base,id:"b",amountMinor:1300,sourceReference:null}])).toHaveLength(0));
});
