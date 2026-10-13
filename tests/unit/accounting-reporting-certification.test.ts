import {describe,expect,it} from "vitest";
import {buildReportingPackage,assertReportingLineage,lockReportingPackage} from "../../src/domain/accounting/reporting-certification";
const scope={organizationId:"org",legalEntityId:"entity",fiscalPeriodId:"p1",currency:"USD"};
const accounts=[
 {accountId:"cash",code:"1000",name:"Cash",type:"ASSET",normalBalance:"DEBIT" as const,debitMinor:100n,creditMinor:0n},
 {accountId:"equity",code:"3000",name:"Equity",type:"EQUITY",normalBalance:"CREDIT" as const,debitMinor:0n,creditMinor:100n},
];
const ledger=[{accountId:"cash",debitMinor:100n,creditMinor:0n,normalBalance:"DEBIT" as const}];
const clean={scope,accounts,ledger,forecastByAccount:{cash:90n},close:{dWaveStatus:"PASS" as const,cWaveStatus:"PASS" as const,controllerApproved:true,approvedBy:"controller"}};
describe("E1-E10 reporting and FP&A certification",()=>{
 it("E1 builds statements only from scoped accounting inputs",()=>{expect(buildReportingPackage(clean).statements.controls.trialBalanceBalanced).toBe(true);});
 it("E2 enforces balance-sheet integrity",()=>{const p=buildReportingPackage({...clean,accounts:[accounts[0]]});expect(p.blockers).toContain("TRIAL_BALANCE_OUT_OF_BALANCE");expect(p.blockers).toContain("BALANCE_SHEET_OUT_OF_BALANCE");});
 it("E3 blocks unclassified cash-flow activity",()=>{const odd={accountId:"odd",code:"9999",name:"Unknown",type:"ASSET",normalBalance:"DEBIT" as const,debitMinor:1n,creditMinor:0n};const offset={accountId:"eq",code:"3001",name:"Equity",type:"EQUITY",normalBalance:"CREDIT" as const,debitMinor:0n,creditMinor:1n};expect(buildReportingPackage({...clean,accounts:[odd,offset],ledger:[]}).blockers).toContain("CASH_FLOW_UNCLASSIFIED");});
 it("E4 projects deterministic ledger actuals",()=>{expect(buildReportingPackage(clean).actuals[0].sourceKey).toBe("ledger:org:entity:p1:USD:cash");});
 it("E5 computes exact actual-versus-forecast variance",()=>{expect(buildReportingPackage(clean).variances[0]).toMatchObject({actualMinor:100n,forecastMinor:90n,deltaMinor:10n,direction:"ABOVE"});});
 it("E6 preserves reporting lineage",()=>{expect(()=>assertReportingLineage(buildReportingPackage(clean))).not.toThrow();});
 it("E7 requires D-wave certification",()=>{expect(buildReportingPackage({...clean,close:{...clean.close,dWaveStatus:"BLOCKED"}}).blockers).toContain("D_WAVE_NOT_CERTIFIED");});
 it("E8 keeps deferred C-wave as a hard reporting blocker",()=>{const p=buildReportingPackage({...clean,close:{...clean.close,cWaveStatus:"DEFERRED"}});expect(p.status).toBe("BLOCKED");expect(p.blockers).toContain("C_WAVE_NOT_CERTIFIED");});
 it("E9 requires named controller approval",()=>{expect(buildReportingPackage({...clean,close:{...clean.close,controllerApproved:false,approvedBy:undefined}}).blockers).toContain("CONTROLLER_APPROVAL_REQUIRED");});
 it("E10 locks only a clean review-ready package",()=>{const p=buildReportingPackage(clean);expect(p.status).toBe("READY_FOR_REVIEW");expect(lockReportingPackage(p,"controller")).toMatchObject({status:"LOCKED",lockedBy:"controller"});expect(()=>lockReportingPackage(buildReportingPackage({...clean,close:{...clean.close,cWaveStatus:"DEFERRED"}}),"controller")).toThrow("REPORTING_PACKAGE_NOT_READY");});
});
