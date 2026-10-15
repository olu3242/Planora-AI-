/** B7: immutable correction proposals; posting requires a separate governed workflow. */
export type CorrectionLine={accountId:string;debitMinor:number;creditMinor:number};
export function draftCorrection(input:{organizationId:string;legalEntityId:string;fiscalPeriodId:string;reason:string;periodLocked:boolean;lines:readonly CorrectionLine[]}){
 if(!input.organizationId||!input.legalEntityId||!input.fiscalPeriodId||!input.reason.trim())throw Error("CORRECTION_CONTEXT_REQUIRED");
 if(input.periodLocked)throw Error("PERIOD_LOCKED");
 if(input.lines.length<2||input.lines.some(l=>!l.accountId||!Number.isSafeInteger(l.debitMinor)||!Number.isSafeInteger(l.creditMinor)||l.debitMinor<0||l.creditMinor<0||(l.debitMinor>0&&l.creditMinor>0)))throw Error("INVALID_JOURNAL_LINES");
 const debit=input.lines.reduce((n,l)=>n+BigInt(l.debitMinor),0n),credit=input.lines.reduce((n,l)=>n+BigInt(l.creditMinor),0n);
 if(debit===0n||debit!==credit)throw Error("UNBALANCED_JOURNAL");
 return {scope:{organizationId:input.organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId},reason:input.reason,lines:input.lines.map(l=>({...l})),decision:"APPROVAL_REQUIRED" as const,canPost:false as const};
}
