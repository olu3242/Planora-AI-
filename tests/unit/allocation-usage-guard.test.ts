import { describe, expect, it } from 'vitest';
import { assertAllocationUsable } from '../../src/domain/forecast/allocation-usage-guard';
const rule={organizationId:'o',preparedById:'maker',approvedById:'checker',status:'APPROVED' as const};
describe('allocation usage guard',()=>{
 it('accepts approved same-tenant rule',()=>expect(()=>assertAllocationUsable({rule,organizationId:'o'})).not.toThrow());
 it('rejects cross tenant use',()=>expect(()=>assertAllocationUsable({rule,organizationId:'other'})).toThrow('ALLOCATION_CROSS_TENANT'));
 it('rejects draft rule',()=>expect(()=>assertAllocationUsable({rule:{...rule,status:'DRAFT'},organizationId:'o'})).toThrow('ALLOCATION_NOT_APPROVED'));
});
