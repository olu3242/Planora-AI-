import {describe,expect,it} from 'vitest';
import {buildAllocationEvidence} from '../../src/domain/forecast/allocation-evidence';
const scope={organizationId:'o',legalEntityId:'e',fiscalPeriodId:'p',accountId:'a',currencyCode:'USD',sourceIdentifier:'ledger:1'};
const rule={...scope,id:'rule',status:'APPROVED' as const,preparedById:'maker',approvedById:'checker',shares:[{costCenterId:'c1',percentage:'50'},{costCenterId:'c2',percentage:'50'}]};
describe('allocation evidence',()=>{
 it('retains source identity and reconciled amounts',()=>{
  const evidence=buildAllocationEvidence({...scope,rule,amountMinor:101n});
  expect(evidence.ruleId).toBe('rule');
  expect(evidence.sourceAmountMinor).toBe('101');
  expect(evidence.allocations.reduce((sum,row)=>sum+BigInt(row.amountMinor),0n)).toBe(101n);
 });
});
