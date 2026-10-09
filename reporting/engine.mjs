export const frameworks = Object.freeze({
 IFRS:{sectors:["private","nonprofit"],jurisdictions:["*"]},
 US_GAAP:{sectors:["private","nonprofit"],jurisdictions:["US"]},
 GASB:{sectors:["public"],jurisdictions:["US"],subtypes:["state_local"]},
 FASAB:{sectors:["public"],jurisdictions:["US"],subtypes:["federal"]},
 IPSAS:{sectors:["public"],jurisdictions:["*"]},
 IFRS_SMES:{sectors:["private"],jurisdictions:["*"]},
 UK_GAAP:{sectors:["private","nonprofit"],jurisdictions:["GB","IE"]}
});
export function validateConfiguration(c){
 const errors=[];
 if(!c || typeof c!=="object") return {valid:false,errors:["Configuration required"]};
 const rule=frameworks[c.framework];
 if(!rule) errors.push("Unsupported framework");
 else {
  if(!rule.sectors.includes(c.sector)) errors.push("Sector/framework mismatch");
  if(!rule.jurisdictions.includes("*")&&!rule.jurisdictions.includes(c.jurisdiction)) errors.push("Jurisdiction/framework mismatch");
  if(rule.subtypes&&!rule.subtypes.includes(c.subtype)) errors.push("Entity subtype/framework mismatch");
 }
 for(const k of ["entityId","sector","jurisdiction","framework","standardVersion","effectiveDate","currency"]) if(typeof c[k]!=="string"||!c[k].trim()) errors.push("Missing "+k);
 if(c.effectiveDate && (!/^\d{4}-\d{2}-\d{2}$/.test(c.effectiveDate)||Number.isNaN(Date.parse(c.effectiveDate)))) errors.push("Invalid effective date");
 if(c.currency&&!/^[A-Z]{3}$/.test(c.currency)) errors.push("Invalid currency");
 return {valid:errors.length===0,errors};
}
export function prepareReport({config,entries,period}){
 const check=validateConfiguration(config);
 if(!check.valid) throw new Error(check.errors.join("; "));
 if(!/^\d{4}-\d{2}$/.test(period)||Number.isNaN(Date.parse(period+"-01"))) throw new Error("Invalid period");
 if(!Array.isArray(entries)) throw new Error("Entries required");
 let debit=0,credit=0;
 const byAccount=new Map();
 for(const e of entries){
  if(e.entityId!==config.entityId) throw new Error("Cross-entity entry rejected");
  if(typeof e.account!=="string"||!e.account.trim()) throw new Error("Invalid account");
  if(!Number.isSafeInteger(e.debitMinor)||!Number.isSafeInteger(e.creditMinor)||e.debitMinor<0||e.creditMinor<0) throw new Error("Invalid monetary amount");
  if((e.debitMinor===0)===(e.creditMinor===0)) throw new Error("Exactly one debit or credit required per entry");
  debit+=e.debitMinor;credit+=e.creditMinor;
  if(!Number.isSafeInteger(debit)||!Number.isSafeInteger(credit)) throw new Error("Monetary overflow");
  byAccount.set(e.account,(byAccount.get(e.account)||0)+e.debitMinor-e.creditMinor);
 }
 if(debit!==credit) throw new Error("Unbalanced ledger");
 return {entityId:config.entityId,framework:config.framework,standardVersion:config.standardVersion,period,currency:config.currency,status:"DRAFT_REVIEW_REQUIRED",totalDebitsMinor:debit,totalCreditsMinor:credit,trialBalance:[...byAccount].sort(([a],[b])=>a.localeCompare(b)).map(([account,netMinor])=>({account,netMinor})),limitations:["Trial balance only; framework-specific statements and disclosure compliance not certified"]};
}
export class PlanoraReportAgent {
 constructor({approve}){this.approve=approve}
 prepare(request){return prepareReport(request)}
 publish(report,approval){if(report.status!=="DRAFT_REVIEW_REQUIRED"||!this.approve?.(approval,report)) throw new Error("Authorized human approval required");return {...report,status:"APPROVED_FOR_ISSUANCE",approvalReference:approval.reference}}
}
