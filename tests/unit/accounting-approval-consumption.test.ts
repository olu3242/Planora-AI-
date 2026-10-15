import { describe, expect, it, vi } from 'vitest';
import { createPrismaJournalPostingRepository } from '../../src/lib/accounting/prisma-posting-adapter';

const actor='maker', organization='org-a';
const input = {
  actorId:actor,organizationId:organization,legalEntityId:'entity-a',fiscalPeriodId:'period-a',
  sourceKey:'source-a',currencyCode:'USD',
  lines:[
    {accountId:'cash',debitMinor:100n,creditMinor:0n},
    {accountId:'revenue',debitMinor:0n,creditMinor:100n},
  ],
};
function fixture(consumptionCount:number) {
  const approval={id:'approval-a',decidedById:'reviewer-a'};
  const tx={
    organizationMembership:{findFirst:vi.fn(async()=>({role:'CFO',active:true}))},
    legalEntity:{findFirst:vi.fn(async()=>({id:'entity-a'}))},
    fiscalPeriod:{findFirst:vi.fn(async()=>({accountingCloseState:'OPEN',startDate:new Date('2026-01-01'),endDate:new Date('2026-12-31')}))},
    currency:{findUnique:vi.fn(async()=>({code:'USD'}))},
    account:{findMany:vi.fn(async()=>[
      {id:'cash',effectiveFrom:new Date('2025-01-01'),effectiveTo:null},
      {id:'revenue',effectiveFrom:new Date('2025-01-01'),effectiveTo:null},
    ])},
    accountingJournal:{findUnique:vi.fn(async()=>null),create:vi.fn(async()=>({id:'journal-a'})),update:vi.fn(async()=>({}))},
    accountingPostingApproval:{findUnique:vi.fn(async()=>({
      id:approval.id,organizationId:organization,legalEntityId:'entity-a',fiscalPeriodId:'period-a',
      sourceKey:'source-a',preparedById:actor,decidedById:'reviewer-a',decision:'APPROVED',
      expiresAt:new Date(Date.now()+60000),consumedAt:null,
    })),updateMany:vi.fn(async()=>({count:consumptionCount}))},
    accountingJournalLine:{findMany:vi.fn(async()=>[])},
    auditEvent:{create:vi.fn(async()=>({id:'audit-a'}))},
  };
  const db={$transaction:vi.fn(async(cb:(client:typeof tx)=>Promise<unknown>)=>cb(tx))};
  return {tx,db,approval};
}
describe('approval consumption is scoped and atomic',()=>{
  it('requires scope and unexpired approval in conditional update',async()=>{
    const {tx,db}=fixture(1);
    await expect(createPrismaJournalPostingRepository(db as never,actor,organization).postAtomically(input as never))
      .resolves.toEqual({journalId:'journal-a',created:true});
    expect(tx.accountingPostingApproval.updateMany).toHaveBeenCalledWith({
      where:expect.objectContaining({
        id:'approval-a',organizationId:organization,legalEntityId:'entity-a',
        fiscalPeriodId:'period-a',sourceKey:'source-a',decision:'APPROVED',
        consumedAt:null,journalId:null,expiresAt:{gt:expect.any(Date)},
      }),
      data:expect.objectContaining({journalId:'journal-a',consumedAt:expect.any(Date)}),
    });
    expect(tx.auditEvent.create).toHaveBeenCalledTimes(1);
  });
  it('rejects consumption races without creating audit evidence',async()=>{
    const {tx,db}=fixture(0);
    await expect(createPrismaJournalPostingRepository(db as never,actor,organization).postAtomically(input as never))
      .rejects.toThrow('APPROVAL_ALREADY_CONSUMED');
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });
});
