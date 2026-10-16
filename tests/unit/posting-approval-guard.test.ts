import { describe, expect, it } from 'vitest';
import { checkPostingApproval } from '../../src/domain/accounting/posting-approval-guard';

const now = new Date('2026-10-15T12:00:00Z');
const approval = {
  organizationId: 'org-a',
  legalEntityId: 'entity-a',
  fiscalPeriodId: 'period-a',
  sourceKey: 'invoice-1',
  preparedById: 'maker',
  decidedById: 'checker',
  decision: 'APPROVED',
  expiresAt: new Date('2026-10-16T12:00:00Z'),
  consumedAt: null,
};
const request = {
  organizationId: 'org-a',
  legalEntityId: 'entity-a',
  fiscalPeriodId: 'period-a',
  sourceKey: 'invoice-1',
  actorId: 'poster',
  now,
  periodState: 'OPEN' as const,
};
describe('posting approval guard', () => {
  it('accepts approved unconsumed separate maker/checker', () => {
    expect(checkPostingApproval(approval,request)).toEqual({ok:true});
  });
  it('rejects cross-tenant approval', () => {
    expect(checkPostingApproval({...approval,organizationId:'org-b'},request)).toEqual({ok:false,code:'INVALID_SCOPE'});
  });
  it('rejects cross-entity approval', () => {
    expect(checkPostingApproval({...approval,legalEntityId:'entity-b'},request)).toEqual({ok:false,code:'INVALID_SCOPE'});
  });
  it('rejects wrong source key', () => {
    expect(checkPostingApproval({...approval,sourceKey:'other'},request)).toEqual({ok:false,code:'INVALID_SCOPE'});
  });
  it('rejects hard-closed periods', () => {
    expect(checkPostingApproval(approval,{...request,periodState:'HARD_CLOSED'})).toEqual({ok:false,code:'PERIOD_CLOSED'});
  });
  it('rejects soft-closed periods', () => {
    expect(checkPostingApproval(approval,{...request,periodState:'SOFT_CLOSED'})).toEqual({ok:false,code:'PERIOD_CLOSED'});
  });
  it('rejects pending decisions', () => {
    expect(checkPostingApproval({...approval,decision:'PENDING'},request)).toEqual({ok:false,code:'APPROVAL_NOT_APPROVED'});
  });
  it('rejects self-approval', () => {
    expect(checkPostingApproval({...approval,decidedById:'maker'},request)).toEqual({ok:false,code:'SELF_APPROVAL'});
  });
  it('rejects already consumed approvals', () => {
    expect(checkPostingApproval({...approval,consumedAt:now},request)).toEqual({ok:false,code:'APPROVAL_CONSUMED'});
  });
  it('rejects expired approvals at boundary', () => {
    expect(checkPostingApproval({...approval,expiresAt:now},request)).toEqual({ok:false,code:'APPROVAL_EXPIRED'});
  });
  it('rejects invalid request time', () => {
    expect(checkPostingApproval(approval,{...request,now:new Date('invalid')})).toEqual({ok:false,code:'INVALID_TIMESTAMP'});
  });
  it('rejects cross-period approval', () => {
    expect(checkPostingApproval({...approval,fiscalPeriodId:'period-b'},request)).toEqual({ok:false,code:'INVALID_SCOPE'});
  });
  it('rejects a missing approver identity', () => {
    expect(checkPostingApproval({...approval,decidedById:null},request)).toEqual({ok:false,code:'APPROVAL_NOT_APPROVED'});
  });
  it('rejects an invalid approval expiry timestamp', () => {
    expect(checkPostingApproval({...approval,expiresAt:new Date('invalid')},request)).toEqual({ok:false,code:'INVALID_TIMESTAMP'});
  });
  it('rejects blank actor identity', () => {
    expect(checkPostingApproval(approval,{...request,actorId:'  '})).toEqual({ok:false,code:'INVALID_SCOPE'});
  });

});
