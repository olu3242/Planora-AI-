import{describe,expect,it}from"vitest";import{createCertificationManifest,assertManifestIntegrity,compareCertificationRuns,assertReleaseBinding,assertNoCriticalWaivers}from"../../src/domain/accounting/certification-manifest";import{requiredAccountingProductionGates}from"../../src/domain/accounting/production-certification";
const gates=()=>requiredAccountingProductionGates().map(id=>({id,passed:true,evidence:`e-${id}`}));const manifest=()=>createCertificationManifest({releaseId:"r1",commitSha:"abc123",createdAt:"2026-10-12T20:00:00Z",gates:gates()});
describe("K1-K10 certification hardening",()=>{
 it("K1 requires release and commit identity",()=>expect(()=>createCertificationManifest({releaseId:"",commitSha:"abc",createdAt:"now",gates:gates()})).toThrow("INVALID_CERTIFICATION_IDENTITY"));
 it("K2 requires exactly one of every production gate",()=>expect(()=>createCertificationManifest({releaseId:"r",commitSha:"abc",createdAt:"now",gates:gates().slice(1)})).toThrow("INVALID_GATE_CARDINALITY"));
 it("K3 creates deterministic evidence fingerprints",()=>expect(manifest().fingerprint).toBe(manifest().fingerprint));
 it("K4 verifies immutable manifest content",()=>expect(()=>assertManifestIntegrity(manifest())).not.toThrow());
 it("K5 detects manifest tampering",()=>{const m=manifest();expect(()=>assertManifestIntegrity({...m,releaseId:"r2"})).toThrow("CERTIFICATION_MANIFEST_TAMPERED")});
 it("K6 detects certification rerun drift",()=>{const a=manifest(),b=createCertificationManifest({releaseId:"r1",commitSha:"abc123",createdAt:"2026-10-12T20:00:00Z",gates:gates().map(g=>g.id==="BUILD"?{...g,evidence:"different"}:g)});expect(compareCertificationRuns(a,b)).toEqual(["BUILD"])});
 it("K7 binds certification to exact release and commit",()=>expect(()=>assertReleaseBinding(manifest(),"r1","abc123")).not.toThrow());
 it("K8 rejects release/commit mismatch",()=>expect(()=>assertReleaseBinding(manifest(),"r1","other")).toThrow("CERTIFICATION_RELEASE_MISMATCH"));
 it("K9 makes C, financial difference, security and E2E non-waivable",()=>expect(()=>assertNoCriticalWaivers(gates().map(g=>g.id==="WAVE_C"?{...g,passed:false}:g))).toThrow("CRITICAL_GATE_NOT_WAIVABLE:WAVE_C"));
 it("K10 accepts critical gates only when evidenced and passing",()=>expect(()=>assertNoCriticalWaivers(gates())).not.toThrow());
});
