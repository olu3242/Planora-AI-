export function accrueExpense({id,entityId,date,expenseAccount,liabilityAccount,amountMinor}){
 if(!Number.isSafeInteger(amountMinor)||amountMinor<=0) throw new Error("Positive integer amount required");
 if(!expenseAccount||!liabilityAccount||expenseAccount===liabilityAccount) throw new Error("Distinct accounts required");
 return {id,entityId,date,lines:[{account:expenseAccount,debitMinor:amountMinor,creditMinor:0},{account:liabilityAccount,debitMinor:0,creditMinor:amountMinor}]};
}
export function reverseAccrual(journal,{id,date}){
 if(!journal||!Array.isArray(journal.lines)) throw new Error("Journal required");
 return {id,entityId:journal.entityId,date,lines:journal.lines.map(x=>({account:x.account,debitMinor:x.creditMinor,creditMinor:x.debitMinor}))};
}
