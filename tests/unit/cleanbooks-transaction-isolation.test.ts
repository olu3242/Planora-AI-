import {describe,it,expect} from "vitest";
import {scanReadiness} from "../../src/lib/cleanbooks/b101-scan-readiness";
import {cleanBooksReleaseGate} from "../../src/lib/cleanbooks/b19-release-gate";
describe("CleanBooks transaction isolation acceptance",()=>{
 it("never authorizes posting from scan readiness",()=>expect(scanReadiness({coverageComplete:true,accountCount:1,transactionCount:1}).canPost).toBe(false));
 it("rejects certification without database integration proof",()=>expect(cleanBooksReleaseGate({baselineValid:true,unitPassed:true,integrationPassed:false,browserPassed:true,securityPassed:true,coverageComplete:true,hostedPassed:true}).decision).toBe("NO_GO"));
});
