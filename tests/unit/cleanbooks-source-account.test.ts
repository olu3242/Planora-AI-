import {describe,it,expect} from "vitest";
import {findDuplicateCandidates} from "../../src/lib/cleanbooks/duplicate-candidates";
import type {CleanupTransaction} from "../../src/lib/cleanbooks/profile-transactions";
const scope={organizationId:"o",legalEntityId:"e"};
const t:CleanupTransaction={id:"1",...scope,currency:"USD",amountMinor:2500,bookedAt:"2026-10-15",description:"Card charge",sourceReference:"ref",sourceAccountId:"bank-a",accountId:null};
describe("CleanBooks source-account E2E safety contract",()=>{
 it("does not conflate different source bank accounts",()=>expect(findDuplicateCandidates([t,{...t,id:"2",sourceAccountId:"bank-b"}],scope)).toEqual([]));
 it("identifies duplicates within same bank account",()=>expect(findDuplicateCandidates([t,{...t,id:"2"}],scope)).toEqual([{firstId:"1",secondId:"2",reason:"SAME_SOURCE_REFERENCE",decision:"REVIEW_REQUIRED"}]));
});
