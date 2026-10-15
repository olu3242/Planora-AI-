import {describe,expect,it} from "vitest";
import {suggestCategories} from "../../src/lib/cleanbooks/category-suggestions";
const scope={organizationId:"org",legalEntityId:"entity"};
const tx={id:"tx1",...scope,currency:"USD",description:"Monthly internet bill"};
const rule={id:"r1",...scope,keyword:"internet",accountId:"utilities",active:true};
describe("CleanBooks B3 categorization",()=>{
 it("suggests only for review",()=>expect(suggestCategories([tx],[rule],scope)).toEqual([{transactionId:"tx1",proposedAccountId:"utilities",ruleId:"r1",confidence:"RULE_MATCH",decision:"REVIEW_REQUIRED"}]));
 it("skips ambiguous account mappings",()=>expect(suggestCategories([tx],[rule,{...rule,id:"r2",accountId:"software"}],scope)).toEqual([]));
 it("ignores inactive rules",()=>expect(suggestCategories([tx],[{...rule,active:false}],scope)).toEqual([]));
 it("enforces currency",()=>expect(suggestCategories([tx],[{...rule,currency:"EUR"}],scope)).toEqual([]));
 it("fails closed on cross-tenant rule",()=>expect(()=>suggestCategories([tx],[{...rule,organizationId:"other"}],scope)).toThrow("CLEANBOOKS_CROSS_SCOPE"));
});
