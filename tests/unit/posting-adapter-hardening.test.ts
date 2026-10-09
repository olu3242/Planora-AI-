import { describe, expect, it, vi } from "vitest";
import { createPrismaJournalPostingRepository } from "../../src/lib/accounting/prisma-posting-adapter";

const base = {
  actorId: "actor", organizationId: "org", legalEntityId: "entity",
  fiscalPeriodId: "period", sourceKey: "key-1", currencyCode: "USD",
  lines: [
    { accountId: "cash", debitMinor: 100n, creditMinor: 0n },
    { accountId: "sales", debitMinor: 0n, creditMinor: 100n },
  ],
};
describe("adapter preflight hardening", () => {
  it("blocks unbalanced input before database transaction", async () => {
    const db = { $transaction: vi.fn() };
    const repo = createPrismaJournalPostingRepository(db as never, "actor", "org");
    await expect(repo.postAtomically({ ...base, lines: [
      base.lines[0], { accountId: "sales", debitMinor: 0n, creditMinor: 99n },
    ] })).rejects.toThrow("UNBALANCED_JOURNAL");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("rejects malformed currency code", async () => {
    const db = { $transaction: vi.fn() };
    const repo = createPrismaJournalPostingRepository(db as never, "actor", "org");
    await expect(repo.postAtomically({ ...base, currencyCode: "usd" })).rejects.toThrow("CURRENCY_CODE_INVALID");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
