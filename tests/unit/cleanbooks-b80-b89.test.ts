import {describe,it,expect} from "vitest";
import {pageCoverage} from "../../src/lib/cleanbooks/b20-pagination";
import {normalizeBankAmount,normalizeBankDate} from "../../src/lib/cleanbooks/b32-normalization";
import {transactionFingerprint} from "../../src/lib/cleanbooks/b21-fingerprint";
import {profileTransactions} from "../../src/lib/cleanbooks/profile-transactions";
describe("CleanBooks B80-B89 validation regressions",()=>{
 it("B85: 500 rows with no sentinel can be complete",()=>expect(pageCoverage([{accountId:"a",count:500,limit:500,hasMore:false}]).complete).toBe(true));
 it("B86: 501st sentinel marks scan incomplete",()=>expect(pageCoverage([{accountId:"a",count:500,limit:500,hasMore:true}]).truncatedAccountIds).toEqual(["a"]));
 it("B87: malformed bank date fails closed",()=>expect(()=>normalizeBankDate(undefined as unknown as Date)).toThrow("INVALID_BANK_DATE"));
 it("B88: unsafe amount fails closed",()=>expect(()=>normalizeBankAmount(BigInt(Number.MAX_SAFE_INTEGER)+1n)).toThrow("CLEANBOOKS_AMOUNT_OUT_OF_RANGE"));
 it("B89: missing description does not crash profiler",()=>{const t={id:"t",organizationId:"o",legalEntityId:"e",sourceAccountId:"bank",currency:"USD",amountMinor:1,bookedAt:"2026-10-15",description:undefined as unknown as string};expect(profileTransactions([t],{organizationId:"o",legalEntityId:"e"}).exceptions.map(e=>e.code)).toContain("MISSING_DESCRIPTION");expect(transactionFingerprint(t)).toContain("bank")});
});
