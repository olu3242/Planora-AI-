import{describe,expect,it}from"vitest";import{goldenAccountingSteps}from"../../src/domain/accounting/golden-journey-certification";import{buildProductionCertificationPacket}from"../../src/domain/accounting/production-certification-packet";
const golden=goldenAccountingSteps.map(step=>({step,passed:true,evidence:`evidence-${step}`}));const waves="ABCDEFGHI".split("").map(x=>({id:`WAVE_${x}`,passed:true,evidence:`cert-${x}`}));
const clean=()=>({waveEvidence:waves,goldenEvidence:golden,unexplainedDifferenceMinor:0n,coveragePassed:true,buildPassed:true,securityPassed:true,e2ePassed:true});
describe("J golden journey production packet",()=>{
 it("returns GO only for a complete clean packet",()=>expect(buildProductionCertificationPacket(clean()).decision).toBe("GO"));
 it("fails closed when C-wave evidence is absent",()=>expect(buildProductionCertificationPacket({...clean(),waveEvidence:waves.filter(x=>x.id!=="WAVE_C")}).blockers).toContain("WAVE_C"));
 it("fails when bank reconciliation is not evidenced",()=>expect(buildProductionCertificationPacket({...clean(),goldenEvidence:golden.map(x=>x.step==="BANK_RECONCILIATION"?{...x,passed:false,evidence:""}:x)}).blockers).toContain("GOLDEN_ACCOUNTING_JOURNEY"));
 it("fails on any unexplained financial difference",()=>expect(buildProductionCertificationPacket({...clean(),unexplainedDifferenceMinor:1n}).blockers).toContain("ZERO_UNEXPLAINED_DIFFERENCE"));
 it("fails independently on coverage, build, security and E2E",()=>{for(const key of ["coveragePassed","buildPassed","securityPassed","e2ePassed"] as const)expect(buildProductionCertificationPacket({...clean(),[key]:false}).decision).toBe("NO_GO")});
});