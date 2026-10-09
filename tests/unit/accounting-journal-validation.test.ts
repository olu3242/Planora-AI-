import { describe, expect, it } from "vitest";
import { validateJournal } from "../../src/domain/accounting/journal-validation";

const debit = { accountId: "cash", debitMinor: 12500n, creditMinor: 0n };
const credit = { accountId: "revenue", debitMinor: 0n, creditMinor: 12500n };

describe("journal validation", () => {
  it("accepts balanced minor-unit entries", () => {
    expect(() => validateJournal([debit, credit])).not.toThrow();
  });
  it("rejects unbalanced entries", () => {
    expect(() => validateJournal([debit, { ...credit, creditMinor: 12499n }])).toThrow("UNBALANCED_JOURNAL");
  });
  it("rejects single-sided entries", () => {
    expect(() => validateJournal([debit])).toThrow("JOURNAL_REQUIRES_TWO_LINES");
  });
  it("rejects zero-value and dual-sided lines", () => {
    expect(() => validateJournal([debit, { ...credit, creditMinor: 0n }])).toThrow("EXACTLY_ONE_SIDE_REQUIRED");
    expect(() => validateJournal([debit, { ...credit, debitMinor: 1n }])).toThrow("EXACTLY_ONE_SIDE_REQUIRED");
  });
  it("rejects negative amounts", () => {
    expect(() => validateJournal([{ ...debit, debitMinor: -1n }, credit])).toThrow("NEGATIVE_AMOUNT");
  });
});
