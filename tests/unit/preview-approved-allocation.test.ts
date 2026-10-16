import { describe, expect, it } from 'vitest';
import { previewApprovedAllocation } from '../../src/domain/forecast/preview-approved-allocation';
const scope={organizationId:'o',legalEntityId:'e',fiscalPeriodId:'p',accountId:'a',currencyCode:'USD',sourceIdentifier:'ledger:1'};
const rule={...scope,id:'rule',preparedById:'maker',approvedById:'checker',status:'APPROVED' as const,shares:[{costCenterId:'cc',percentage:'100'}]};
describe('approved allocation preview',()=>{
 it('preserves rule lineage and amount',()=>expect(previewApprovedAllocation({...scope,rule,amountMinor:123n})).toEqual([expect.objectContaining({ruleId:'rule',amountMinor:123n,costCenterId:'cc'})]));
 it('rejects mismatched account',()=>expect(()=>previewApprovedAllocation({...scope,accountId:'other',rule,amountMinor:123n})).toThrow('ALLOCATION_RULE_SCOPE_MISMATCH'));
});
