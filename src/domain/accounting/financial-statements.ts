export type StatementAccount = Readonly<{accountId:string;code:string;name:string;type:string;normalBalance:"DEBIT"|"CREDIT";debitMinor:bigint;creditMinor:bigint}>;
export type FinancialStatementSet = Readonly<{
 profitAndLoss: readonly StatementAccount[];
 balanceSheet: readonly StatementAccount[];
 cashFlow: Readonly<{operatingMinor:bigint;investingMinor:bigint;financingMinor:bigint;netChangeMinor:bigint;unclassifiedMinor:bigint}>;
 controls: Readonly<{trialBalanceBalanced:boolean;balanceSheetBalanced:boolean;cashFlowClassified:boolean}>;
}>;

const net=(a:StatementAccount)=>a.normalBalance==="DEBIT"?a.debitMinor-a.creditMinor:a.creditMinor-a.debitMinor;
const pnlTypes=new Set(["REVENUE","COGS","OPERATING_EXPENSE","OTHER_INCOME","OTHER_EXPENSE"]);
const bsTypes=new Set(["ASSET","LIABILITY","EQUITY"]);

export function classifyCashFlow(code:string,name:string,type:string):"OPERATING"|"INVESTING"|"FINANCING"|"UNCLASSIFIED"{
 const s=(code+" "+name).toUpperCase();
 if(/CASH|BANK/.test(s)) return "UNCLASSIFIED";
 if(/PPE|PROPERTY|PLANT|EQUIPMENT|CAPEX|INVESTMENT|INTANGIBLE/.test(s)) return "INVESTING";
 if(/DEBT|LOAN|BORROW|EQUITY|CAPITAL|DIVIDEND|TREASURY/.test(s)) return "FINANCING";
 if(["REVENUE","COGS","OPERATING_EXPENSE","OTHER_INCOME","OTHER_EXPENSE"].includes(type)||/RECEIVABLE|PAYABLE|INVENTORY|ACCRUAL|PREPAID/.test(s)) return "OPERATING";
 return "UNCLASSIFIED";
}

export function buildFinancialStatements(accounts:readonly StatementAccount[]):FinancialStatementSet{
 const debit=accounts.reduce((n,a)=>n+a.debitMinor,0n),credit=accounts.reduce((n,a)=>n+a.creditMinor,0n);
 const profitAndLoss=accounts.filter(a=>pnlTypes.has(a.type));
 const balanceSheet=accounts.filter(a=>bsTypes.has(a.type));
 const assets=balanceSheet.filter(a=>a.type==="ASSET").reduce((n,a)=>n+net(a),0n);
 const liabilitiesEquity=balanceSheet.filter(a=>a.type==="LIABILITY"||a.type==="EQUITY").reduce((n,a)=>n+net(a),0n);
 let operatingMinor=0n,investingMinor=0n,financingMinor=0n,unclassifiedMinor=0n;
 for(const a of accounts){const amount=net(a);switch(classifyCashFlow(a.code,a.name,a.type)){case"OPERATING":operatingMinor+=amount;break;case"INVESTING":investingMinor+=amount;break;case"FINANCING":financingMinor+=amount;break;default:unclassifiedMinor+=amount;}}
 return {profitAndLoss,balanceSheet,cashFlow:{operatingMinor,investingMinor,financingMinor,netChangeMinor:operatingMinor+investingMinor+financingMinor,unclassifiedMinor},controls:{trialBalanceBalanced:debit===credit,balanceSheetBalanced:assets===liabilitiesEquity,cashFlowClassified:unclassifiedMinor===0n}};
}
