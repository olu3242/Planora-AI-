import {prepareReport,validateConfiguration} from "./engine.mjs";
const packs={
 IFRS:{statements:["financial_position","profit_or_loss_and_oci","cash_flows","changes_in_equity"]},
 US_GAAP:{statements:["balance_sheet","income_statement","cash_flows","equity"]},
 GASB:{statements:["government_wide","governmental_funds","fund_reconciliation"]},
 FASAB:{statements:["balance_sheet","net_cost","changes_in_net_position","budgetary_resources"]},
 IPSAS:{statements:["financial_position","financial_performance","cash_flows","net_assets"]},
 IFRS_SMES:{statements:["financial_position","comprehensive_income","cash_flows","equity"]},
 UK_GAAP:{statements:["balance_sheet","profit_and_loss","cash_flows","equity"]}
};
export function frameworkContract(config){
 const check=validateConfiguration(config);
 if(!check.valid) throw new Error(check.errors.join("; "));
 return {framework:config.framework,version:config.standardVersion,requiredStatements:[...packs[config.framework].statements],certification:"NOT_CERTIFIED"};
}
export function executeFramework({config,entries,period,mappings}){
 const contract=frameworkContract(config);
 if(!mappings||typeof mappings!=="object"||Array.isArray(mappings)) throw new Error("Mappings required");
 const trial=prepareReport({config,entries,period});
 const totals=new Map();
 for(const line of trial.trialBalance){
  const m=mappings[line.account];
  if(!m||!contract.requiredStatements.includes(m.statement)||typeof m.section!=="string"||!m.section.trim()) throw new Error("Missing or invalid framework mapping: "+line.account);
  const key=m.statement+"|"+m.section;
  const value=(totals.get(key)||0)+line.netMinor;
  if(!Number.isSafeInteger(value)) throw new Error("Monetary overflow");
  totals.set(key,value);
 }
 const statements=contract.requiredStatements.map(name=>({name,sections:[...totals].filter(([k])=>k.startsWith(name+"|")).map(([k,amountMinor])=>({section:k.slice(name.length+1),amountMinor}))}));
 const checks={configuration:true,ledgerBalanced:trial.totalDebitsMinor===trial.totalCreditsMinor,allAccountsMapped:true,frameworkMappingValid:true};
 if(Object.values(checks).some(v=>!v)) throw new Error("Verification failed");
 return {contract,trialBalance:trial.trialBalance,statements,checks,status:"DRAFT_UNCERTIFIED",limitations:["Statement sections are mapped balances, not standards-compliant issued statements","Recognition, measurement, disclosure, period cutoffs and authoritative framework rule coverage require certification"]};
}
