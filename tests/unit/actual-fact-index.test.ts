import { describe, expect, it } from 'vitest';
import { actualFactKey, indexActualFacts } from '../../src/domain/forecast/actual-fact-index';
describe('actual fact indexing', () => {
 it('distinguishes currencies for one account', () => {
  const rows=[{accountId:'a',currencyCode:'USD',costCenterId:null,amount:1},{accountId:'a',currencyCode:'EUR',costCenterId:null,amount:2}];
  expect(indexActualFacts(rows).size).toBe(2);
 });
 it('rejects duplicate account-currency facts', () => {
  expect(()=>indexActualFacts([{accountId:'a',currencyCode:'USD',costCenterId:null},{accountId:'a',currencyCode:'USD',costCenterId:null}])).toThrow('DUPLICATE_ACTUAL_FACT_GRAIN');
 });
 it('rejects invalid currencies', () => expect(()=>actualFactKey({accountId:'a',currencyCode:'usd',costCenterId:null})).toThrow());
});
