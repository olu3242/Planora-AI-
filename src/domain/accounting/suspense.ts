export const SUSPENSE_PROCESS_STAGES = [
 "CAPTURED","IDENTIFIED","CLASSIFIED","ASSIGNED","INVESTIGATING","PROPOSED","APPROVED","CLEARED"
] as const;
export type SuspenseStage = typeof SUSPENSE_PROCESS_STAGES[number];
export type SuspenseIdentifierInput = Readonly<{organizationId:string;legalEntityId:string;fiscalPeriodId:string;sourceType:string;sourceId:string}>;

const token=(value:string)=>value.trim().toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,24);
export function suspenseIdentifier(input:SuspenseIdentifierInput){
 return ["SUS",token(input.organizationId),token(input.legalEntityId),token(input.fiscalPeriodId),token(input.sourceType),token(input.sourceId)].join(":");
}
export function canTransitionSuspense(from:SuspenseStage,to:SuspenseStage){
 const a=SUSPENSE_PROCESS_STAGES.indexOf(from),b=SUSPENSE_PROCESS_STAGES.indexOf(to);
 return b===a+1;
}
export function assertSuspenseTransition(from:SuspenseStage,to:SuspenseStage){
 if(!canTransitionSuspense(from,to)) throw new Error("INVALID_SUSPENSE_TRANSITION");
}
