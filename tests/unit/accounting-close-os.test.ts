import{describe,expect,it}from"vitest";import{approveAndHardClose,assertPeriodPostingAllowed,certifyClose,closeBlockers,reopenPeriod,requestCloseApproval,startClose,type CloseRun}from"../../src/domain/accounting/close-os";
const tasks=["BANK_RECONCILIATION","AP_RECONCILIATION","AR_RECONCILIATION","TRIAL_BALANCE","STATEMENTS","FPA_ACTUALS"].map(id=>({id:id as any,status:"COMPLETE" as const,evidence:`evidence-${id}`}));
const clean=()=>startClose({organizationId:"org",legalEntityId:"entity",periodId:"2026-10",tasks,dependencies:{C_WAVE:"PASS",D_WAVE:"PASS",E_WAVE:"PASS"},preparedBy:"preparer"});
describe("F1-F10 Close OS",()=>{
 it("F1 starts a scoped close run",()=>expect(clean().state).toBe("IN_PROGRESS"));
 it("F2 requires close checklist evidence",()=>{const r={...clean(),tasks:[{...tasks[0],evidence:""}]};expect(closeBlockers(r)).toContain("TASK_BANK_RECONCILIATION_EVIDENCE_REQUIRED")});
 it("F3 keeps deferred C-wave a hard close blocker",()=>{const r={...clean(),dependencies:{C_WAVE:"DEFERRED" as const,D_WAVE:"PASS" as const,E_WAVE:"PASS" as const}};expect(()=>requestCloseApproval(r)).toThrow("CLOSE_PREREQUISITES_INCOMPLETE")});
 it("F4 requires D-wave certification",()=>expect(closeBlockers({...clean(),dependencies:{C_WAVE:"PASS",D_WAVE:"BLOCKED",E_WAVE:"PASS"}})).toContain("D_WAVE_NOT_CERTIFIED"));
 it("F5 requires E-wave reporting certification",()=>expect(closeBlockers({...clean(),dependencies:{C_WAVE:"PASS",D_WAVE:"PASS",E_WAVE:"BLOCKED"}})).toContain("E_WAVE_NOT_CERTIFIED"));
 it("F6 moves clean close to approval",()=>expect(requestCloseApproval(clean()).state).toBe("WAITING_APPROVAL"));
 it("F7 enforces preparer/approver segregation",()=>expect(()=>approveAndHardClose(requestCloseApproval(clean()),"preparer")).toThrow("SEGREGATION_OF_DUTIES_VIOLATION"));
 it("F8 hard-closes after independent approval",()=>expect(approveAndHardClose(requestCloseApproval(clean()),"controller").state).toBe("HARD_CLOSED"));
 it("F9 blocks posting to a hard-closed period",()=>expect(()=>assertPeriodPostingAllowed(approveAndHardClose(requestCloseApproval(clean()),"controller"))).toThrow("PERIOD_NOT_OPEN"));
 it("F10 governs reopen and close certification",()=>{const closed=approveAndHardClose(requestCloseApproval(clean()),"controller");expect(certifyClose(closed)).toEqual({status:"PASS",blockers:[]});expect(()=>reopenPeriod(closed,{actorId:"preparer",reason:"adjustment",authorized:true})).toThrow("SEGREGATION_OF_DUTIES_VIOLATION");expect(reopenPeriod(closed,{actorId:"controller-2",reason:"approved adjustment",authorized:true}).state).toBe("REOPENED")});
});
