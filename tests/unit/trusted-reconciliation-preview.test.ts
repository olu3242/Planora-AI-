import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('../../src/lib/prisma',()=>({authenticationPrisma:{},prisma:{}}));
vi.mock('../../src/lib/accounting/bank-mapping-tenant-context',()=>({withBankMappingTenant:async(_db:unknown,_trusted:unknown,work:(tx:unknown)=>Promise<unknown>)=>work({organizationMembership:{findFirst:async()=>({role:'VIEWER',active:true})}})}));
vi.mock('../../src/application/accounting/reconciliation-service',()=>({previewReconciliation:vi.fn()}));
import {previewReconciliationForTrustedActor} from '../../src/application/accounting/trusted-reconciliation-preview';
describe('trusted preview',()=>{
 it('denies viewer before preview query',async()=>{
  await expect(previewReconciliationForTrustedActor({organizationId:'org',actorId:'actor'},'bank')).rejects.toThrow('RECONCILIATION_PREVIEW_DENIED');
 });
});
