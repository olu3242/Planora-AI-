import { describe, expect, it } from "vitest";
import { formatPercent, money } from "@/domain/financial/money";

describe("financial decimal precision", () => {
  it("does not introduce binary floating point error", () => expect(money("0.1").plus("0.2").toFixed()).toBe("0.3"));
  it("uses banker rounding for presentation precision", () => {
    expect(money("2.345").toDecimalPlaces(2).toFixed(2)).toBe("2.34");
    expect(money("2.355").toDecimalPlaces(2).toFixed(2)).toBe("2.36");
  });
  it("presents percentages to at most four decimals", () => expect(formatPercent("73.333333333333333333")).toBe("73.3333%"));
});
