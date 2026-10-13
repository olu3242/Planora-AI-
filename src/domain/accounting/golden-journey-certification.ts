export const goldenAccountingSteps=["COMPANY_PERIOD","COA","VENDOR_BILL","BILL_APPROVAL","BILL_PAYMENT","BANK_IMPORT","AI_MATCH","BANK_RECONCILIATION","CUSTOMER_INVOICE","CASH_COLLECTION","ADJUSTMENTS","SUBLEDGER_GL_RECONCILIATION","TRIAL_BALANCE","CLOSE_LOCK","THREE_STATEMENTS","STATEMENT_DRILLDOWN","FPA_ACTUALS","VARIANCE","AI_EXPLANATION"] as const;
export type GoldenAccountingStep=typeof goldenAccountingSteps[number];
export type GoldenEvidence=Readonly<{step:GoldenAccountingStep;passed:boolean;evidence:string}>;
export function certifyGoldenAccountingJourney(items:readonly GoldenEvidence[]){
 const blockers:string[]=[];for(const step of goldenAccountingSteps){const matches=items.filter(x=>x.step===step);if(matches.length!==1||!matches[0].passed||!matches[0].evidence.trim())blockers.push(step)}
 return{passed:blockers.length===0,blockers};
}
