import{describe,expect,it}from"vitest";
import{classifyProductionCertification,requiredAccountingProductionGates}from"../../src/domain/accounting/production-certification";
const clean=()=>requiredAccountingProductionGates().map(id=>({id,passed:true,evidence:"verified"}));
describe("J production certification core",()=>{
 it("returns GO only when every required gate has evidence",()=>expect(classifyProductionCertification(clean())).toEqual({decision:"GO",blockers:[]}));
 it("returns NO_GO when C-wave is deferred or failed",()=>{const gates=clean().map(g=>g.id==="WAVE_C"?{...g,passed:false,evidence:"deferred"}:g);expect(classifyProductionCertification(gates)).toEqual({decision:"NO_GO",blockers:["WAVE_C"]})});
 it("returns NO_GO when golden accounting journey evidence is missing",()=>{const gates=clean().map(g=>g.id==="GOLDEN_ACCOUNTING_JOURNEY"?{...g,evidence:""}:g);expect(classifyProductionCertification(gates).blockers).toContain("GOLDEN_ACCOUNTING_JOURNEY")});
 it("requires financial, coverage, build, security and E2E gates",()=>expect(requiredAccountingProductionGates()).toEqual(expect.arrayContaining(["ZERO_UNEXPLAINED_DIFFERENCE","COVERAGE","BUILD","SECURITY","E2E"])));
});