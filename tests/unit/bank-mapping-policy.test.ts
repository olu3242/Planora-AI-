import { describe, expect, it } from 'vitest';
import { isApprovedBankMapping } from '../../src/domain/accounting/bank-mapping-policy';
const valid = {organizationId:'a',bankOrganizationId:'a',cashOrganizationId:'a',approved:true,revoked:false,currency:'USD',cashCurrency:'USD'};
describe('bank mapping policy',()=>{
 it('accepts a scoped approved active mapping',()=>expect(isApprovedBankMapping(valid)).toBe(true));
 it.each([
  {approved:false}, {revoked:true}, {bankOrganizationId:'b'}, {cashOrganizationId:'b'}, {currency:'EUR'}, {cashCurrency:'EUR'}, {currency:'usd'}
 ])('rejects unsafe mapping %o',change=>expect(isApprovedBankMapping({...valid,...change})).toBe(false));
});
