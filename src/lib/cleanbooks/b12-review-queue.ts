export type Finding={id:string;severity:"ERROR"|"WARNING";status:"OPEN"|"REVIEWED"|"DISMISSED";reason:string};
export function reviewQueue(findings:readonly Finding[]){const seen=new Set<string>();return findings.map(f=>{if(!f.id||!f.reason.trim()||seen.has(f.id))throw Error("INVALID_FINDING");seen.add(f.id);return {...f,actionRequired:f.status==="OPEN",canAutoResolve:false as const}})}
