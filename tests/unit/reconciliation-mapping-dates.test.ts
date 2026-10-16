import {describe,it,expect} from 'vitest';
function isEffective(from:Date,to:Date|null,date:Date){return from<=date&&(!to||to>=date)}
describe('cash account effective date boundaries',()=>{
 const from=new Date('2026-01-01T00:00:00Z');
 const to=new Date('2026-12-31T00:00:00Z');
 it('includes start and end',()=>{expect(isEffective(from,to,from)).toBe(true);expect(isEffective(from,to,to)).toBe(true)});
 it('excludes outside interval',()=>{expect(isEffective(from,to,new Date('2025-12-31T00:00:00Z'))).toBe(false);expect(isEffective(from,to,new Date('2027-01-01T00:00:00Z'))).toBe(false)});
});
