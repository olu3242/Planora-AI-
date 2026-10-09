import test from "node:test";
import assert from "node:assert/strict";
import {PeriodLedger} from "./period-ledger.mjs";
import {reviewClose} from "./close-review.mjs";
const config={entityId:"e1",sector:"private",jurisdiction:"US",framework:"US_GAAP",standardVersion:"2026",effectiveDate:"2026-01-01",currency:"USD"};
const chart={Cash:{type:"asset",active:true},Revenue:{type:"revenue",active:true}};
const journal={id:"j1",entityId:"e1",date:"2026-10-08",lines:[{account:"Cash",debitMinor:100,creditMinor:0},{account:"Revenue",debitMinor:0,creditMinor:100}]};
function setup(){const ledger=new PeriodLedger({config,chart});ledger.post(journal,"controller");return ledger}
const reconciliations=[{account:"Cash",externalBalanceMinor:100},{account:"Revenue",externalBalanceMinor:-100}];
test("balanced reconciled period is ready for approval",()=>assert.equal(reviewClose({ledger:setup(),config,chart,period:"2026-10",reconciliations}).status,"READY_FOR_HUMAN_APPROVAL"));
test("missing reconciliation blocks",()=>assert.equal(reviewClose({ledger:setup(),config,chart,period:"2026-10",reconciliations:reconciliations.slice(0,1)}).status,"BLOCKED"));
test("mismatch blocks",()=>assert.equal(reviewClose({ledger:setup(),config,chart,period:"2026-10",reconciliations:[{...reconciliations[0],externalBalanceMinor:99},reconciliations[1]]}).status,"BLOCKED"));
test("duplicate reconciliation rejected",()=>assert.throws(()=>reviewClose({ledger:setup(),config,chart,period:"2026-10",reconciliations:[reconciliations[0],reconciliations[0]]}),/duplicate/));
test("invalid period rejected",()=>assert.throws(()=>reviewClose({ledger:setup(),config,chart,period:"2026-99",reconciliations}),/period/));
