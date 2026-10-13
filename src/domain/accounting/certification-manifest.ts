import{requiredAccountingProductionGates,type ProductionGate}from"./production-certification";
export type CertificationManifest=Readonly<{releaseId:string;commitSha:string;createdAt:string;gates:readonly ProductionGate[];fingerprint:string}>;
function canonical(g:readonly ProductionGate[]){return [...g].sort((a,b)=>a.id.localeCompare(b.id)).map(x=>`${x.id}|${x.passed?1:0}|${x.evidence.trim()}`).join("\n")}
function hash(s:string){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,"0")}
export function createCertificationManifest(i:Readonly<{releaseId:string;commitSha:string;createdAt:string;gates:readonly ProductionGate[]}>):CertificationManifest{
 if(!i.releaseId.trim()||!i.commitSha.trim()||!i.createdAt.trim())throw new Error("INVALID_CERTIFICATION_IDENTITY");const required=requiredAccountingProductionGates();for(const id of required)if(i.gates.filter(g=>g.id===id).length!==1)throw new Error(`INVALID_GATE_CARDINALITY:${id}`);
 const body=[i.releaseId,i.commitSha,i.createdAt,canonical(i.gates)].join("\n");return Object.freeze({...i,gates:Object.freeze([...i.gates]),fingerprint:hash(body)});
}
export function assertManifestIntegrity(m:CertificationManifest):void{if(createCertificationManifest(m).fingerprint!==m.fingerprint)throw new Error("CERTIFICATION_MANIFEST_TAMPERED")}
export function compareCertificationRuns(a:CertificationManifest,b:CertificationManifest):readonly string[]{const am=new Map(a.gates.map(x=>[x.id,x]));return b.gates.filter(x=>{const p=am.get(x.id);return !p||p.passed!==x.passed||p.evidence.trim()!==x.evidence.trim()}).map(x=>x.id).sort()}
export function assertReleaseBinding(m:CertificationManifest,releaseId:string,commitSha:string):void{if(m.releaseId!==releaseId||m.commitSha!==commitSha)throw new Error("CERTIFICATION_RELEASE_MISMATCH")}
export function assertNoCriticalWaivers(gates:readonly ProductionGate[]):void{for(const id of ["WAVE_C","ZERO_UNEXPLAINED_DIFFERENCE","SECURITY","E2E"])if(gates.some(g=>g.id===id&&(!g.passed||!g.evidence.trim())))throw new Error(`CRITICAL_GATE_NOT_WAIVABLE:${id}`)}
