import { describe, expect, it, vi } from "vitest";
import { reverseJournal } from "../../src/lib/accounting/reverse-journal";

describe("reversal preflight hardening", () => {
  it("rejects incomplete actor context before opening a transaction", async () => {
    const db = { $transaction: vi.fn() };
    await expect(reverseJournal(db as never, { userId: "", organizationId: "org" }, {
      originalId: "original", sourceKey: "reversal-2", reason: "Correction",
    })).rejects.toThrow("REVERSAL_REASON_REQUIRED");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("rejects missing reversal source key", async () => {
    const db = { $transaction: vi.fn() };
    await expect(reverseJournal(db as never, { userId: "actor", organizationId: "org" }, {
      originalId: "original", sourceKey: " ", reason: "Correction",
    })).rejects.toThrow("REVERSAL_REASON_REQUIRED");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
