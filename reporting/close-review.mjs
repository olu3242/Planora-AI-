import {trialBalanceFromJournals} from "./us-gaap-journals.mjs";
export function reviewClose({ledger,config,chart,period,reconciliations=[]}){
 if(!/^\d{4}-\d{2}$/.test(period)||Number.isNaN(Date.parse(period+"-01"))) throw new Error("Invalid period");
 if(!Array.isArray(reconciliations)) throw new Error("Reconciliations required");
 const journals=ledger.getJournals().filter(j=>j.date.slice(0,7)===period);
 const balance=trialBalanceFromJournals({config,chart,journals});
 const accounts=new Set(balance.map(x=>x.account));
 const reviewed=new Set();
 const exceptions=[];
 for(const item of reconciliations){
  if(!item||typeof item.account!=="string"||!accounts.has(item.account)||reviewed.has(item.account)) throw new Error("Invalid or duplicate reconciliation");
  reviewed.add(item.account);
  if(!Number.isSafeInteger(item.externalBalanceMinor)) throw new Error("Invalid reconciliation balance");
  const actual=balance.find(x=>x.account===item.account).netMinor;
  if(actual!==item.externalBalanceMinor) exceptions.push({account:item.account,ledgerMinor:actual,externalMinor:item.externalBalanceMinor});
 }
 for(const account of accounts) if(!reviewed.has(account)) exceptions.push({account,reason:"RECONCILIATION_MISSING"});
 const total=balance.reduce((sum,x)=>sum+x.netMinor,0);
 if(!Number.isSafeInteger(total)||total!==0) exceptions.push({reason:"TRIAL_BALANCE_MISMATCH"});
 const status=exceptions.length?"BLOCKED":"READY_FOR_HUMAN_APPROVAL";
 return {entityId:config.entityId,framework:config.framework,period,status,trialBalance:balance,exceptions,reviewedAccounts:reviewed.size,limitations:["In-memory evidence only","External balances are supplied inputs, not independently verified","Does not certify US GAAP recognition, measurement or disclosures"]};
}
