import { describe, expect, it, vi } from "vitest";
import { createPrismaJournalPostingRepository } from "../../src/lib/accounting/prisma-posting-adapter";

const lines = [
  { accountId: "cash", debitMinor: 100n, creditMinor: 0n },
  { accountId: "sales", debitMinor: 0n, creditMinor: 100n },
];
const input = {
  organizationId: "org", legalEntityId: "entity", fiscalPeriodId: "period",
  actorId: "actor", sourceKey: "source-1", currencyCode: "USD", lines,
};

function fakeDb(overrides: Record<string, unknown> = {}) {
  const tx = {
    organizationMembership: { findFirst: vi.fn().mockResolvedValue({ role: "CFO" }) },
    legalEntity: { findFirst: vi.fn().mockResolvedValue({ id: "entity" }) },
    fiscalPeriod: { findFirst: vi.fn().mockResolvedValue({ accountingCloseState: "OPEN" }) },
    currency: { findUnique: vi.fn().mockResolvedValue({ code: "USD" }) },
    account: { findMany: vi.fn().mockResolvedValue([{ id: "cash" }, { id: "sales" }]) },
    accountingJournal: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "posted-1" }),
      update: vi.fn().mockResolvedValue({ id: "posted-1", status: "POSTED" }),
    },
    accountingJournalLine: { findMany: vi.fn().mockResolvedValue([]) },
    auditEvent: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
    ...overrides,
  };
  const db = { $transaction: vi.fn(async (callback: (value: typeof tx) => unknown) => callback(tx)) };
  return { tx, db };
}

describe("Prisma posting adapter (mock transaction boundary)", () => {
  it("creates one posted journal with balanced lines", async () => {
    const { tx, db } = fakeDb();
    const repo = createPrismaJournalPostingRepository(db as never, "actor", "org");
    expect(await repo.postAtomically(input)).toEqual({ journalId: "posted-1", created: true });
    expect(tx.accountingJournal.create).toHaveBeenCalledTimes(1);
    expect(tx.accountingJournal.update).toHaveBeenCalledWith({ where: { id: "posted-1" }, data: { status: "POSTED", postedAt: expect.any(Date) } });
    expect(tx.auditEvent.create).toHaveBeenCalledTimes(1);
    expect(tx.auditEvent.create.mock.calls[0][0].data.action).toBe("ACCOUNTING_JOURNAL_POSTED");
    expect(tx.accountingJournal.create.mock.calls[0][0].data.lines.create).toHaveLength(2);
  });
  it("rejects forged actor and organization before starting transaction", async () => {
    const { db } = fakeDb();
    const repo = createPrismaJournalPostingRepository(db as never, "actor", "org");
    await expect(repo.postAtomically({ ...input, actorId: "attacker" })).rejects.toThrow("UNTRUSTED_POSTING_CONTEXT");
    await expect(repo.postAtomically({ ...input, organizationId: "other" })).rejects.toThrow("UNTRUSTED_POSTING_CONTEXT");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("denies unauthorized membership", async () => {
    const { tx, db } = fakeDb({ organizationMembership: { findFirst: vi.fn().mockResolvedValue({ role: "ANALYST" }) } });
    await expect(createPrismaJournalPostingRepository(db as never, "actor", "org").postAtomically(input)).rejects.toThrow("POSTING_ROLE_DENIED");
    expect(tx.accountingJournal.create).not.toHaveBeenCalled();
  });
  it("rejects a locked period", async () => {
    const { tx, db } = fakeDb({ fiscalPeriod: { findFirst: vi.fn().mockResolvedValue({ accountingCloseState: "HARD_CLOSED" }) } });
    await expect(createPrismaJournalPostingRepository(db as never, "actor", "org").postAtomically(input)).rejects.toThrow("PERIOD_NOT_OPEN");
    expect(tx.accountingJournal.create).not.toHaveBeenCalled();
  });
  it("rejects replay with different amounts", async () => {
    const { tx, db } = fakeDb({
      accountingJournal: {
        findUnique: vi.fn().mockResolvedValue({ id: "existing", status: "POSTED", legalEntityId: "entity", fiscalPeriodId: "period", currencyCode: "USD" }),
        create: vi.fn(),
        update: vi.fn(),
      },
      accountingJournalLine: { findMany: vi.fn().mockResolvedValue([
        { accountId: "cash", debitMinor: 101n, creditMinor: 0n },
        { accountId: "sales", debitMinor: 0n, creditMinor: 101n },
      ]) },
    });
    await expect(createPrismaJournalPostingRepository(db as never, "actor", "org").postAtomically(input)).rejects.toThrow("IDEMPOTENCY_CONFLICT");
    expect(tx.accountingJournal.create).not.toHaveBeenCalled();
  });
});
