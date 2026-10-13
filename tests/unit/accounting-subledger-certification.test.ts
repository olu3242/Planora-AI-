import { describe, expect, it } from "vitest";
import {
  assertCommonScope, assertCompleteLineage, certifyDWave, createControlSnapshot,
  detectOrphanTrialBalanceAccounts, type ControlSnapshot, type DWaveScope,
} from "../../src/domain/accounting/subledger-certification";

const scope: DWaveScope = { organizationId:"org-1", legalEntityId:"entity-1", periodId:"2026-10", currency:"USD" };
const snapshots: ControlSnapshot[] = [
  { ...scope, control:"AP", asOf:"2026-10-31T23:59:59Z", subledgerMinor:12000n, glControlMinor:12000n },
  { ...scope, control:"AR", asOf:"2026-10-31T23:59:59Z", subledgerMinor:9000n, glControlMinor:9000n },
  { ...scope, control:"CASH", asOf:"2026-10-31T23:59:59Z", subledgerMinor:21000n, glControlMinor:21000n },
];
const tb = [
  { accountId:"cash", debitMinor:21000n, creditMinor:0n },
  { accountId:"ap", debitMinor:0n, creditMinor:12000n },
  { accountId:"equity", debitMinor:0n, creditMinor:9000n },
];
const lineage = snapshots.map((x,i)=>({ ...scope, control:x.control, sourceId:`src-${i}`, subledgerId:`sub-${i}`, journalId:`j-${i}`, ledgerEntryId:`gl-${i}` }));

describe("D2-D10 subledger certification",()=>{
  it("D2 creates immutable scoped balance snapshots",()=>{ expect(Object.isFrozen(createControlSnapshot(snapshots[0]))).toBe(true); });
  it("D3-D5 require AP, AR and Cash to share the certification scope",()=>{ expect(()=>assertCommonScope(scope,snapshots)).not.toThrow(); expect(()=>assertCommonScope(scope,[{...snapshots[0],organizationId:"other"}])).toThrow("TENANT_MISMATCH"); });
  it("D6 preserves trial-balance debit/credit equality",()=>{ expect(certifyDWave({scope,snapshots,trialBalance:tb,knownAccountIds:["cash","ap","equity"],lineage}).status).toBe("PASS"); });
  it("D7 detects orphan GL accounts",()=>{ expect(detectOrphanTrialBalanceAccounts(tb,["cash","ap"])).toEqual(["equity"]); });
  it("D8 returns exact discrepancy evidence",()=>{ const result=certifyDWave({scope,snapshots:[{...snapshots[0],glControlMinor:11999n}],trialBalance:tb,knownAccountIds:["cash","ap","equity"],lineage}); expect(result.exceptions).toContainEqual({code:"AP_GL_OUT_OF_BALANCE",control:"AP",differenceMinor:1n}); expect(result.status).toBe("BLOCKED"); });
  it("D9 requires complete unique source-to-ledger lineage",()=>{ expect(()=>assertCompleteLineage(lineage)).not.toThrow(); expect(()=>assertCompleteLineage([{...lineage[0],journalId:""}])).toThrow("INCOMPLETE_ACCOUNTING_LINEAGE"); expect(()=>assertCompleteLineage([lineage[0],lineage[0]])).toThrow("DUPLICATE_LEDGER_LINEAGE"); });
  it("D10 explicitly blocks cash certification when C-wave bank proof is required",()=>{ const result=certifyDWave({scope,snapshots,trialBalance:tb,knownAccountIds:["cash","ap","equity"],lineage,requireBankReconciliation:true}); expect(result.status).toBe("BLOCKED"); expect(result.blockedBy).toEqual(["C_WAVE"]); expect(result.exceptions).toEqual([]); });
  it("blocks an unbalanced trial balance",()=>{ const result=certifyDWave({scope,snapshots,trialBalance:[...tb,{accountId:"expense",debitMinor:1n,creditMinor:0n}],knownAccountIds:["cash","ap","equity","expense"],lineage}); expect(result.exceptions).toContainEqual({code:"TRIAL_BALANCE_OUT_OF_BALANCE"}); });
});
