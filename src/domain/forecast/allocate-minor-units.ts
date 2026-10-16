import Decimal from 'decimal.js';
import { validateApprovedAllocation, type AllocationShare } from './approved-allocation-policy';

export type AllocatedAmount = Readonly<{ costCenterId: string; amountMinor: bigint }>;
/** Deterministic largest-remainder allocation, preserving the exact original minor-unit total. */
export function allocateMinorUnits(amountMinor: bigint, shares: readonly AllocationShare[], preparedById: string, approvedById: string): AllocatedAmount[] {
 validateApprovedAllocation(shares, preparedById, approvedById);
 const negative = amountMinor < 0n;
 const magnitude = negative ? -amountMinor : amountMinor;
 const ordered = [...shares].sort((a,b)=>a.costCenterId.localeCompare(b.costCenterId));
 const rows = ordered.map(share=>{
  const numerator = new Decimal(magnitude.toString()).mul(share.percentage);
  const exact = numerator.div(100);
  const floor = BigInt(exact.floor().toFixed(0));
  return { costCenterId:share.costCenterId, floor, remainder:exact.minus(floor.toString()) };
 });
 const assigned = rows.reduce((sum,row)=>sum+row.floor,0n);
 let remaining = magnitude-assigned;
 const ranked = [...rows].sort((a,b)=>b.remainder.comparedTo(a.remainder)||a.costCenterId.localeCompare(b.costCenterId));
 for (const row of ranked) { if (remaining===0n) break; row.floor+=1n; remaining-=1n; }
 return ordered.map(share=>{const row=rows.find(r=>r.costCenterId===share.costCenterId)!;return {costCenterId:share.costCenterId,amountMinor:negative?-row.floor:row.floor};});
}
