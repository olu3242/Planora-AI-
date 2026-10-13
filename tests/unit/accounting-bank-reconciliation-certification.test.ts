import{describe,expect,it}from"vitest";import{certifyBankToCashGl,classifyBankAdjustment,ingestBankTransactions,transitionBankException,validateSplit,validateTransfer}from"../../src/domain/accounting/bank-reconciliation-certification";
const tx={id:"b1",organizationId:"org",legalEntityId:"e1",bankAccountId:"bank1",currency:"USD",reference:"ref1",amountMinor:100n,sourceFingerprint:"fp1"};
describe("C1-C10 banking and reconciliation",()=>{
 it("C1 validates normalized bank transaction scope",()=>expect(ingestBankTransactions([tx]).accepted).toHaveLength(1));
 it("C2 deduplicates ingestion by source fingerprint",()=>expect(ingestBankTransactions([tx],["fp1"]).duplicates).toEqual(["b1"]));
 it("C3 preserves deterministic exact matching",()=>expect(certifyBankToCashGl({bank:[{reference:"r",amountMinor:100n}],cashLedger:[{reference:"r",amountMinor:100n}],bankStatementBalanceMinor:100n,cashGlBalanceMinor:100n,reviewerId:"controller",approved:true,lineageKeys:["bank:r:gl"]}).status).toBe("PASS"));
 it("C4 validates split totals exactly",()=>{expect(()=>validateSplit(100n,[60n,40n])).not.toThrow();expect(()=>validateSplit(100n,[60n,39n])).toThrow("INVALID_BANK_SPLIT")});
 it("C5 validates internal transfers as equal and opposite",()=>expect(()=>validateTransfer({...tx,amountMinor:-100n},{...tx,id:"b2",bankAccountId:"bank2",amountMinor:100n,sourceFingerprint:"fp2"})).not.toThrow());
 it("C6 validates bank fee and interest adjustments",()=>expect(classifyBankAdjustment("fee",25n,"FEE")).toEqual({reference:"fee",amountMinor:25n,kind:"FEE"}));
 it("C7 governs exception lifecycle with evidence",()=>expect(transitionBankException({id:"x",transactionId:"b1",status:"OPEN",reason:"unmatched"},"REVIEWED","controller-reviewed").status).toBe("REVIEWED"));
 it("C8 requires authorized reconciliation approval",()=>expect(certifyBankToCashGl({bank:[],cashLedger:[],bankStatementBalanceMinor:0n,cashGlBalanceMinor:0n,reviewerId:"",approved:false,lineageKeys:["x"]}).blockers).toContain("RECONCILIATION_APPROVAL_REQUIRED"));
 it("C9 requires bank statement balance to equal cash GL",()=>expect(certifyBankToCashGl({bank:[],cashLedger:[],bankStatementBalanceMinor:100n,cashGlBalanceMinor:99n,reviewerId:"controller",approved:true,lineageKeys:["x"]}).blockers).toContain("BANK_CASH_GL_BALANCE_MISMATCH"));
 it("C10 requires zero unexplained differences and lineage",()=>{const r=certifyBankToCashGl({bank:[{reference:"r",amountMinor:100n}],cashLedger:[{reference:"r",amountMinor:99n}],bankStatementBalanceMinor:100n,cashGlBalanceMinor:100n,reviewerId:"controller",approved:true,lineageKeys:[]});expect(r.status).toBe("BLOCKED");expect(r.blockers).toEqual(expect.arrayContaining(["UNEXPLAINED_RECONCILIATION_DIFFERENCE","RECONCILIATION_LINEAGE_REQUIRED"]))});
});
