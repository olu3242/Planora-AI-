import { describe, expect, it } from 'vitest';
import { assertAllocationRuleApprovalTransition } from '../../src/domain/forecast/allocation-approval-transition';
const rule={id:'r',organizationId:'o',legalEntityId:'e',fiscalPeriodId:'p',accountId:'a',currencyCode:'USD',sourceIdentifier:'s',preparedById:'maker',approvedById:null,status:'DRAFT' as const,shares:[{costCenterId:'cc',percentage:'100'}]};
describe('allocation approval transition',()=>{
 it('rejects self approval',()=>expect(()=>assertAllocationRuleApprovalTransition({rule,actorId:'maker',organizationId:'o'})).toThrow());
 it('rejects cross tenant',()=>expect(()=>assertAllocationRuleApprovalTransition({rule,actorId:'checker',organizationId:'other'})).toThrow());
 it('accepts independent same-tenant approval',()=>expect(()=>assertAllocationRuleApprovalTransition({rule,actorId:'checker',organizationId:'o'})).not.toThrow());
});
