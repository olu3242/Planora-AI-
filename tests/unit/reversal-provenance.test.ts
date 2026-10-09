import { describe, expect, it, vi } from "vitest";
import { reverseJournal } from "../../src/lib/accounting/reverse-journal";

describe("reversal provenance", () => {
  it("rejects posted journals without an attributable original actor", async () => {
    const create = vi.fn();
    const tx = {
      organizationMembership: { findFirst: vi.fn().mockResolvedValue({ role: "CFO" }) },
      accountingJournal: {
        findFirst: vi.fn().mockResolvedValue({
          id: "journal", postedById: null, reversalOfId: null,
          fiscalPeriodId: "period", lines: [],
        }),
        create,
      },
      fiscalPeriod: { findFirst: vi.fn().mockResolvedValue({ accountingCloseState: "OPEN" }) },
    };
    const db = { $transaction: vi.fn(async (fn: (tx: typeof tx) => unknown) => fn(tx)) };
    await expect(reverseJournal(db as never, { userId: "actor", organizationId: "org" }, {
      originalId: "journal", sourceKey: "reverse-key", reason: "Correction",
    })).rejects.toThrow("ORIGINAL_POSTING_PROVENANCE_REQUIRED");
    expect(create).not.toHaveBeenCalled();
  });
});
