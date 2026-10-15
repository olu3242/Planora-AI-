import {describe,it,expect} from "vitest";
import {cleanBooksPolicy} from "../../src/lib/cleanbooks/b22-policy";
import {reviewPolicy} from "../../src/lib/cleanbooks/b64-review-policy";
import {scanReadiness} from "../../src/lib/cleanbooks/b101-scan-readiness";
describe("CleanBooks finance leadership boundary",()=>{
 it("requires an active member",()=>expect(()=>cleanBooksPolicy({activeMember:false,activeEntity:true,canReview:false,killSwitchEnabled:true})).toThrow("CLEANBOOKS_FORBIDDEN"));
 it("requires active legal entity",()=>expect(()=>cleanBooksPolicy({activeMember:true,activeEntity:false,canReview:false,killSwitchEnabled:true})).toThrow("CLEANBOOKS_FORBIDDEN"));
 it("prevents self review",()=>expect(()=>reviewPolicy({actorId:"same",requesterId:"same",reviewerAuthorized:true,findingOpen:true})).toThrow("CLEANBOOKS_REVIEW_DENIED"));
 it("does not grant posting privileges",()=>expect(scanReadiness({coverageComplete:true,accountCount:1,transactionCount:1}).canPost).toBe(false));
});
