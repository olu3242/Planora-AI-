import { describe, expect, it, vi } from "vitest";
import { reverseJournal } from "../../src/lib/accounting/reverse-journal";

function fixture(options: { closed?: boolean; reversed?: boolean; role?: string } = {}) {
  const tx = {
    organizationMembership: { findFirst: vi.fn().mockResolvedValue({ role: options.role ?? "CFO" }) },
    accountingJournal: {
      findFirst: vi.fn().mockImplementation(({ where }: { where: { reversalOfId?: string } }) =>
        where.reversalOfId
          ? Promise.resolve(options.reversed ? { id: "existing" } : null)
          : Promise.resolve({
              id: "original", organizationId: "org", legalEntityId: "entity",
              fiscalPeriodId: "period", currencyCode: "USD",
              lines: [
                { ordinal: 0, accountId: "cash", debitMinor: 100n, creditMinor: 0n },
                { ordinal: 1, accountId: "revenue", debitMinor: 0n, creditMinor: 100n },
              ],
            })),
      create: vi.fn().mockResolvedValue({ id: "reversal" }),
    },
    fiscalPeriod: { findFirst: vi.fn().mockResolvedValue({ accountingCloseState: options.closed ? "HARD_CLOSED" : "OPEN" }) },
    auditEvent: { create: vi.fn().mockResolvedValue({ id: "audit" }) },
  };
  const db = { $transaction: vi.fn(async (fn: (tx: typeof tx) => unknown) => fn(tx)) };
  return { db, tx };
}
const actor = { userId: "actor", organizationId: "org" };
const request = { originalId: "original", sourceKey: "reversal-1", reason: "Correction" };

describe("journal reversal transaction", () => {
  it("creates compensating journal and audit", async () => {
    const { db, tx } = fixture();
    await expect(reverseJournal(db as never, actor, request)).resolves.toEqual({ journalId: "reversal" });
    const data = tx.accountingJournal.create.mock.calls[0][0].data;
    expect(data.reversalOfId).toBe("original");
    expect(data.lines.create[0]).toMatchObject({ debitMinor: 0n, creditMinor: 100n });
    expect(tx.auditEvent.create).toHaveBeenCalledTimes(1);
  });
  it("rejects closed period", async () => {
    const { db, tx } = fixture({ closed: true });
    await expect(reverseJournal(db as never, actor, request)).rejects.toThrow("PERIOD_LOCKED");
    expect(tx.accountingJournal.create).not.toHaveBeenCalled();
  });
  it("rejects existing reversal", async () => {
    const { db, tx } = fixture({ reversed: true });
    await expect(reverseJournal(db as never, actor, request)).rejects.toThrow("ALREADY_REVERSED");
    expect(tx.accountingJournal.create).not.toHaveBeenCalled();
  });
  it("rejects unauthorized role", async () => {
    const { db, tx } = fixture({ role: "ANALYST" });
    await expect(reverseJournal(db as never, actor, request)).rejects.toThrow("REVERSAL_DENIED");
    expect(tx.accountingJournal.create).not.toHaveBeenCalled();
  });
});
