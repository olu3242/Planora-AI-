import {describe,it,expect} from "vitest";
import {scanReadiness} from "../../src/lib/cleanbooks/b101-scan-readiness";
import {pageCoverage} from "../../src/lib/cleanbooks/b20-pagination";
import {assembleCleanBooksScan} from "../../src/lib/cleanbooks/scan-pipeline";
const scope={organizationId:"o",legalEntityId:"e"};
describe("CleanBooks B100-B109 scan consistency contracts",()=>{
 it("B102 incomplete coverage blocks readiness",()=>expect(scanReadiness({coverageComplete:false,accountCount:1,transactionCount:20000}).status).toBe("INCOMPLETE"));
 it("B103 empty bank accounts are explicit",()=>expect(scanReadiness({coverageComplete:true,accountCount:0,transactionCount:0}).status).toBe("NO_ACCOUNTS"));
 it("B104 empty bank transactions are explicit",()=>expect(scanReadiness({coverageComplete:true,accountCount:1,transactionCount:0}).status).toBe("NO_TRANSACTIONS"));
 it("B105 complete populated scan is review-only",()=>expect(scanReadiness({coverageComplete:true,accountCount:1,transactionCount:1}).canPost).toBe(false));
 it("B106 invalid counts fail closed",()=>expect(()=>scanReadiness({coverageComplete:true,accountCount:-1,transactionCount:0})).toThrow("INVALID_SCAN_COUNTS"));
 it("B107 pagination reports truncation",()=>expect(pageCoverage([{accountId:"a",count:20000,limit:20000,hasMore:true}]).complete).toBe(false));
 it("B108 incomplete scan never reports ready dashboard",()=>expect(assembleCleanBooksScan([],scope,false).dashboard.readiness).toBe("INCOMPLETE"));
 it("B109 cross-tenant scan fails closed",()=>expect(()=>assembleCleanBooksScan([{id:"x",organizationId:"foreign",legalEntityId:"e",currency:"USD",amountMinor:1,bookedAt:"2026-10-15",description:"test"}],scope,true)).toThrow("CLEANBOOKS_CROSS_SCOPE"));
});
