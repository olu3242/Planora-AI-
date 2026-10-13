import{describe,expect,it}from"vitest";import{consolidate}from"../../src/domain/accounting/consolidation";
const scope={organizationId:"org",groupId:"group",periodId:"2026-10",presentationCurrency:"USD"};const deps={C_WAVE:"PASS" as const,D_WAVE:"PASS" as const,E_WAVE:"PASS" as const,F_WAVE:"PASS" as const};
const balances=[{entityId:"e1",accountId:"cash",currency:"USD",debitMinor:100n,creditMinor:0n,translatedDebitMinor:100n,translatedCreditMinor:0n,sourceKey:"e1:cash"},{entityId:"e2",accountId:"equity",currency:"USD",debitMinor:0n,creditMinor:100n,translatedDebitMinor:0n,translatedCreditMinor:100n,sourceKey:"e2:equity"}];
const base={scope,entities:["e1","e2"],balances,intercompany:[{reference:"ic1",fromEntityId:"e1",toEntityId:"e2",receivableMinor:25n,payableMinor:25n,currency:"USD"}],dependencies:deps,preparedBy:"preparer",approvedBy:"controller"};
describe("G1-G10 consolidation",()=>{
 it("G1 validates group/entity scope",()=>expect(()=>consolidate(base)).not.toThrow());
 it("G2 aggregates translated entity balances",()=>expect(consolidate(base).trialBalance).toHaveLength(2));
 it("G3 preserves exact presentation-currency amounts",()=>expect(consolidate(base).trialBalance[0].debitMinor).toBe(100n));
 it("G4 matches intercompany balances exactly",()=>expect(consolidate(base).eliminatedMinor).toBe(25n));
 it("G5 blocks intercompany mismatches",()=>expect(consolidate({...base,intercompany:[{...base.intercompany[0],payableMinor:24n}]}).exceptions).toContain("INTERCOMPANY_MISMATCH:ic1"));
 it("G6 rejects duplicate intercompany references",()=>expect(consolidate({...base,intercompany:[base.intercompany[0],base.intercompany[0]]}).status).toBe("BLOCKED"));
 it("G7 enforces consolidated trial-balance equality",()=>expect(consolidate({...base,balances:[balances[0]]}).exceptions).toContain("CONSOLIDATED_TRIAL_BALANCE_OUT_OF_BALANCE"));
 it("G8 requires lineage on every entity balance",()=>expect(consolidate({...base,balances:[{...balances[0],sourceKey:""},balances[1]]}).exceptions).toContain("CONSOLIDATION_LINEAGE_MISSING"));
 it("G9 inherits prior-wave certification blockers",()=>expect(consolidate({...base,dependencies:{...deps,C_WAVE:"DEFERRED"}}).exceptions).toContain("C_WAVE_NOT_CERTIFIED"));
 it("G10 requires independent approval before PASS",()=>{expect(consolidate(base).status).toBe("PASS");expect(consolidate({...base,approvedBy:"preparer"}).exceptions).toContain("SEGREGATION_OF_DUTIES_VIOLATION")});
});
