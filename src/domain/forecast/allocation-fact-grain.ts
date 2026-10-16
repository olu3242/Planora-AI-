/** Deterministic derived fact identity, separate from posted ledger grain. */
export function allocationFactGrain(input:Readonly<{ruleId:string;allocationKey:string}>):string{
 if(!input.ruleId.trim()||!input.allocationKey.trim())throw new Error('ALLOCATION_FACT_IDENTITY_MISSING');
 return JSON.stringify(['fpa-allocation',input.ruleId,input.allocationKey]);
}
