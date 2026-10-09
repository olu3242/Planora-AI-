import test from "node:test";
import assert from "node:assert/strict";
import {PeriodLedger} from "./period-ledger.mjs";
import {CloseWorkflow} from "./close-workflow.mjs";
import {accrueExpense,reverseAccrual} from "./accruals.mjs";
import {certifyDraft} from "./certification.mjs";
const config={entityId:"e1",sector:"private",jurisdiction:"US",framework:"US_GAAP",standardVersion:"2026",effectiveDate:"2026-01-01",currency:"USD"};
const chart={Expense:{type:"expense",active:true},Payable:{type:"liability",active:true}};
const journal=accrueExpense({id:"a1",entityId:"e1",date:"2026-10-08",expenseAccount:"Expense",liabilityAccount:"Payable",amountMinor:100});
function fixture(){const ledger=new PeriodLedger({config,chart});ledger.post(journal,"controller");const authorize=(p,role)=>p.roles.includes(role);const workflow=new CloseWorkflow({ledger,config,chart,authorize});const reconciliations=[{account:"Expense",externalBalanceMinor:100},{account:"Payable",externalBalanceMinor:-100}];return {ledger,workflow,reconciliations}}
test("accrual and reversal balance",()=>{const reverse=reverseAccrual(journal,{id:"a2",date:"2026-11-01"});assert.equal(reverse.lines[0].creditMinor,100)});
test("rejects invalid accrual",()=>assert.throws(()=>accrueExpense({id:"x",entityId:"e1",date:"2026-10-08",expenseAccount:"Expense",liabilityAccount:"Payable",amountMinor:0}),/Positive/));
test("controller submits and independent CFO approves",async()=>{const {workflow,reconciliations}=fixture();await workflow.submit({period:"2026-10",reconciliations,principal:{id:"a",roles:["controller"]}});const result=await workflow.approve({period:"2026-10",principal:{id:"b",roles:["cfo"]}});assert.equal(result.status,"APPROVED");assert.equal(workflow.verifyAudit(),true)});
test("self approval denied",async()=>{const {workflow,reconciliations}=fixture();await workflow.submit({period:"2026-10",reconciliations,principal:{id:"a",roles:["controller","cfo"]}});await assert.rejects(()=>workflow.approve({period:"2026-10",principal:{id:"a",roles:["controller","cfo"]}}),/Segregation/)});
test("unauthorized submission denied",async()=>{const {workflow,reconciliations}=fixture();await assert.rejects(()=>workflow.submit({period:"2026-10",reconciliations,principal:{id:"a",roles:[]}}),/Unauthorized/)});
test("draft certification does not assert standards compliance",()=>{const result=certifyDraft({config,period:"2026-10",entries:[{entityId:"e1",account:"Cash",debitMinor:100,creditMinor:0},{entityId:"e1",account:"Revenue",debitMinor:0,creditMinor:100}],mappings:{Cash:{statement:"balance_sheet",section:"assets"},Revenue:{statement:"income_statement",section:"revenue"}},expected:[{statement:"balance_sheet",section:"assets",amountMinor:100}],disclosureEvidence:[{reference:"review-1",reviewed:true}]});assert.equal(result.status,"DRAFT_CHECKS_PASSED_NOT_COMPLIANCE_CERTIFIED")});
