export type Evidence={source:string;sourceId:string;observedAt:string;correlationId:string;ruleVersion:string};
export function validateEvidence(e:Evidence){if(!e.source||!e.sourceId||!e.correlationId||!e.ruleVersion||Number.isNaN(Date.parse(e.observedAt)))throw Error("INVALID_EVIDENCE");return Object.freeze({...e})}
