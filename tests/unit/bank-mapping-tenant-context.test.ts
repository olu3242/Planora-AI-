import {describe,it,expect} from 'vitest';
import {withBankMappingTenant} from '../../src/lib/accounting/bank-mapping-tenant-context';
describe('bank mapping tenant context',()=>{
 it('rejects malformed organization id before querying',async()=>{
  const db={$transaction:()=>{throw new Error('DATABASE_CALLED')}};
  await expect(withBankMappingTenant(db as never,{organizationId:'invalid',actorId:'invalid'},async()=>null)).rejects.toThrow('TRUSTED_TENANT_IDENTITY_REQUIRED');
 });
});
