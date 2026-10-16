import { describe, expect, it } from 'vitest';
import { assertAllocationRuleScope } from '../../src/domain/forecast/allocation-rule-snapshot';
const scope={organizationId:'o',legalEntityId:'e',fiscalPeriodId:'p',accountId:'a',currencyCode:'USD',sourceIdentifier:'ledger:1'};
const rule={...scope,id:'rule',preparedById:'maker',approvedById:'checker',status:'APPROVED' as const,shares:[{costCenterId:'cc',percentage:'100'}]};
describe('allocation rule scope',()=>{
 it('accepts exact scope',()=>expect(()=>assertAllocationRuleScope(rule,scope)).not.toThrow());
 it('rejects wrong entity',()=>expect(()=>assertAllocationRuleScope(rule,{...scope,legalEntityId:'other'})).toThrow('ALLOCATION_RULE_SCOPE_MISMATCH'));
 it('rejects draft',()=>expect(()=>assertAllocationRuleScope({...rule,status:'DRAFT'},scope)).toThrow('ALLOCATION_RULE_NOT_APPROVED'));
});
