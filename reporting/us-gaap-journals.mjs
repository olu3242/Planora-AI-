import {validateConfiguration} from "./engine.mjs";
const types=new Set(["asset","liability","equity","revenue","expense"]);
export function postJournal({config,chart,journal,periodStatus="OPEN"}){
 const check=validateConfiguration(config);
 if(!check.valid) throw new Error(check.errors.join("; "));
 if(config.framework!=="US_GAAP") throw new Error("US GAAP policy module only");
 if(periodStatus!=="OPEN") throw new Error("Closed period");
 if(!chart||typeof chart!=="object"||Array.isArray(chart)) throw new Error("Chart required");
 if(!journal||typeof journal!=="object"||!Array.isArray(journal.lines)||journal.lines.length<2) throw new Error("Journal requires two or more lines");
 if(journal.entityId!==config.entityId) throw new Error("Cross-entity journal");
 if(typeof journal.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(journal.date)||Number.isNaN(Date.parse(journal.date))||journal.date<config.effectiveDate) throw new Error("Invalid journal date");
 if(typeof journal.id!=="string"||!journal.id.trim()) throw new Error("Journal ID required");
 let debits=0,credits=0;
 const lines=journal.lines.map(line=>{
  const account=chart[line.account];
  if(!account||!types.has(account.type)||account.active!==true) throw new Error("Invalid or inactive account");
  if(!Number.isSafeInteger(line.debitMinor)||!Number.isSafeInteger(line.creditMinor)||line.debitMinor<0||line.creditMinor<0||(line.debitMinor===0)===(line.creditMinor===0)) throw new Error("Invalid journal line amount");
  debits+=line.debitMinor;credits+=line.creditMinor;
  if(!Number.isSafeInteger(debits)||!Number.isSafeInteger(credits)) throw new Error("Amount overflow");
  return Object.freeze({account:line.account,debitMinor:line.debitMinor,creditMinor:line.creditMinor});
 });
 if(debits!==credits) throw new Error("Journal not balanced");
 return Object.freeze({id:journal.id,entityId:journal.entityId,date:journal.date,framework:config.framework,lines:Object.freeze(lines),debitsMinor:debits,creditsMinor:credits,status:"VALIDATED_NOT_PERSISTED"});
}
export function trialBalanceFromJournals({config,chart,journals}){
 if(!Array.isArray(journals)) throw new Error("Journals required");
 const totals=new Map();
 const ids=new Set();
 for(const journal of journals){
  const result=postJournal({config,chart,journal});
  if(ids.has(result.id)) throw new Error("Duplicate journal ID");
  ids.add(result.id);
  for(const line of result.lines){
   const net=(totals.get(line.account)||0)+line.debitMinor-line.creditMinor;
   if(!Number.isSafeInteger(net)) throw new Error("Amount overflow");
   totals.set(line.account,net);
  }
 }
 return [...totals].sort(([a],[b])=>a.localeCompare(b)).map(([account,netMinor])=>({account,type:chart[account].type,netMinor}));
}
