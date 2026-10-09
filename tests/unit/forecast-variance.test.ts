import { describe, expect, it } from "vitest";
import { calculateMovement, calculateVariance } from "@/domain/forecast/variance";

describe("forecast variance calculations", () => {
  it("calculates actual less forecast and current less prior exactly", () => {
    const variance = calculateVariance("120", "100"); const movement = calculateMovement("90", "100");
    expect([variance.amount.toFixed(), variance.percentage.toFixed()]).toEqual(["20", "20"]);
    expect([movement.amount.toFixed(), movement.percentage.toFixed()]).toEqual(["-10", "-10"]);
  });

  it("returns a safe zero percentage when the comparison basis is zero", () => {
    const variance = calculateVariance("15", "0"); const movement = calculateMovement("15", "0");
    expect([variance.amount.toFixed(), variance.percentage.toFixed()]).toEqual(["15", "0"]);
    expect([movement.amount.toFixed(), movement.percentage.toFixed()]).toEqual(["15", "0"]);
  });

  it("preserves decimal, negative, and large-value signs without binary rounding", () => {
    const decimal = calculateVariance("100.125001", "99.125000"); expect(decimal.amount.toFixed(6)).toBe("1.000001");
    const negative = calculateVariance("-90", "-100"); expect([negative.amount.toFixed(), negative.percentage.toFixed()]).toEqual(["10", "10"]);
    const large = calculateMovement("999999999999999999", "999999999999999998"); expect(large.amount.toFixed()).toBe("1");
  });
});
