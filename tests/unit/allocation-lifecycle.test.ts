import { describe, expect, it } from 'vitest';
import { approveAllocation, revokeAllocation } from '../../src/domain/forecast/allocation-lifecycle';
const draft={organizationId:'o',preparedById:'maker',approvedById:null,status:'DRAFT' as const};
describe('allocation lifecycle',()=>{
 it('requires independent approval',()=>expect(()=>approveAllocation(draft,'maker')).toThrow());
 it('approves then revokes',()=>{const approved=approveAllocation(draft,'checker');expect(approved.status).toBe('APPROVED');expect(revokeAllocation(approved,'checker').status).toBe('REVOKED');});
 it('cannot approve twice',()=>expect(()=>approveAllocation(approveAllocation(draft,'checker'),'another')).toThrow());
});
