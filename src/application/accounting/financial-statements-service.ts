import "server-only";
import { prisma } from "@/lib/prisma";
import { buildFinancialStatements } from "@/domain/accounting/financial-statements";

export async function getLedgerFinancialStatements(organizationId:string,input:{legalEntityId:string;fiscalPeriodId:string}){
 const journals=await prisma.accountingJournal.findMany({where:{organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,status:"POSTED"},select:{currencyCode:true,lines:{select:{debitMinor:true,creditMinor:true,account:{select:{id:true,code:true,name:true,type:true,normalBalance:true,statementClass:true,statementSection:true,reportingCode:true,cashFlowClass:true,systemPurpose:true}}}}}});
 const currencies=[...new Set(journals.map(j=>j.currencyCode))]; if(currencies.length>1) throw new Error("STATEMENTS_REQUIRE_SINGLE_CURRENCY");
 type LedgerAccount=(typeof journals)[number]["lines"][number]["account"];
 type AccountBalance=Omit<LedgerAccount,"id">&{accountId:string;debitMinor:bigint;creditMinor:bigint};
 const byAccount=new Map<string,AccountBalance>();
 for(const line of journals.flatMap(j=>j.lines)){const a=line.account;const row=byAccount.get(a.id)??{accountId:a.id,code:a.code,name:a.name,type:a.type,normalBalance:a.normalBalance,debitMinor:0n,creditMinor:0n,statementClass:a.statementClass,statementSection:a.statementSection,reportingCode:a.reportingCode,cashFlowClass:a.cashFlowClass,systemPurpose:a.systemPurpose};row.debitMinor+=line.debitMinor;row.creditMinor+=line.creditMinor;byAccount.set(a.id,row);}
 const accounts=[...byAccount.values()];
 const missing=accounts.filter(a=>a.type!=="STATISTICAL"&&(!a.statementClass||!a.reportingCode||!a.cashFlowClass));
 const statements=buildFinancialStatements(accounts);
 return {currencyCode:currencies[0]??null,...statements,coaControl:{mapped:missing.length===0,unmappedAccounts:missing.map(a=>({accountId:a.accountId,code:a.code,name:a.name}))}};
}
