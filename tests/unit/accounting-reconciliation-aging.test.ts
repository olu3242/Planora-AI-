import { describe, expect, it } from "vitest";
import { reconcileExact } from "../../src/domain/accounting/reconciliation";
import { calculateAging } from "../../src/domain/accounting/aging";

describe("reconciliation", () => {
  it("matches only unique exact references and amounts", () => {
    const result = reconcileExact(
      [{ reference: "A", amountMinor: 500n }, { reference: "B", amountMinor: -100n }],
      [{ reference: "A", amountMinor: 500n }, { reference: "B", amountMinor: -90n }],
    );
    expect(result.matched).toEqual(["A"]);
    expect(result.unmatchedBank).toHaveLength(1);
    expect(result.unmatchedLedger).toHaveLength(1);
    expect(result.differenceMinor).toBe(-10n);
  });
  it("does not auto-match ambiguous duplicate references", () => {
    const item = { reference: "X", amountMinor: 100n };
    expect(reconcileExact([item, item], [item, item]).matched).toHaveLength(0);
  });
});
describe("invoice and bill aging", () => {
  it("calculates all overdue buckets", () => {
    const dates = ["2026-10-08", "2026-10-07", "2026-09-01", "2026-08-01", "2026-06-01"];
    const items = dates.map((dueDate, i) => ({ id: String(i), dueDate, outstandingMinor: 100n }));
    expect(calculateAging(items, "2026-10-08")).toEqual({
      current: 100n, days1to30: 100n, days31to60: 100n, days61to90: 100n, over90: 100n,
    });
  });
  it("rejects invalid dates and negative amounts", () => {
    expect(() => calculateAging([{ id: "1", dueDate: "2026-02-30", outstandingMinor: 1n }], "2026-10-08")).toThrow("INVALID_DATE");
    expect(() => calculateAging([{ id: "1", dueDate: "2026-10-01", outstandingMinor: -1n }], "2026-10-08")).toThrow("NEGATIVE_OUTSTANDING");
  });
});
