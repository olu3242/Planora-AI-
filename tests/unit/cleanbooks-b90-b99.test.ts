import {describe,it,expect} from "vitest";
import {pageCoverage} from "../../src/lib/cleanbooks/b20-pagination";
import {enforceScanBudget} from "../../src/lib/cleanbooks/b51-scan-budget";
import {assembleCleanBooksScan} from "../../src/lib/cleanbooks/scan-pipeline";
const scope={organizationId:"o",legalEntityId:"e"};
describe("CleanBooks B90-B99 pagination acceptance",()=>{
 it("B95 accepts complete multipage scan evidence",()=>expect(pageCoverage([{accountId:"a",count:1200,limit:20000,hasMore:false}]).complete).toBe(true));
 it("B96 marks resource-capped account incomplete",()=>expect(pageCoverage([{accountId:"a",count:20000,limit:20000,hasMore:true}]).truncatedAccountIds).toEqual(["a"]));
 it("B97 blocks more than 100 accounts",()=>expect(()=>enforceScanBudget({accounts:101,rows:0,maxAccounts:100,maxRows:20000})).toThrow("SCAN_BUDGET_EXCEEDED"));
 it("B98 blocks oversized row budgets",()=>expect(()=>enforceScanBudget({accounts:1,rows:20001,maxAccounts:100,maxRows:20000})).toThrow("SCAN_BUDGET_EXCEEDED"));
 it("B99 incomplete coverage cannot be clean",()=>expect(assembleCleanBooksScan([],scope,false).dashboard.readiness).toBe("INCOMPLETE"));
});
