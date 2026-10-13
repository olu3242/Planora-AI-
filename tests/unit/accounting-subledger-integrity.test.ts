import { describe, expect, it } from "vitest";
import {
  assertSubledgerIntegrity,
  reconcileSubledgerToGl,
  type SubledgerBalance,
} from "../../src/domain/accounting/subledger-integrity";

const ap: SubledgerBalance = {
  control: "AP",
  organizationId: "org-1",
  legalEntityId: "entity-1",
  periodId: "2026-10",
  currency: "USD",
  subledgerMinor: 125000n,
  glControlMinor: 125000n,
};

describe("D1 subledger-to-GL integrity contract", () => {
  it("certifies an exact AP control-account reconciliation", () => {
    expect(reconcileSubledgerToGl(ap)).toEqual({
      control: "AP",
      differenceMinor: 0n,
      reconciled: true,
    });
  });

  it("reports an exact unexplained difference without rounding it away", () => {
    expect(reconcileSubledgerToGl({ ...ap, glControlMinor: 124999n })).toEqual({
      control: "AP",
      differenceMinor: 1n,
      reconciled: false,
    });
  });

  it.each(["AP", "AR", "CASH"] as const)(
    "blocks %s when the subledger and GL control account differ",
    (control) => {
      expect(() =>
        assertSubledgerIntegrity([
          { ...ap, control, subledgerMinor: 5000n, glControlMinor: 4999n },
        ]),
      ).toThrow(`${control}_GL_OUT_OF_BALANCE`);
    },
  );

  it("rejects invalid scope and negative balances", () => {
    expect(() => reconcileSubledgerToGl({ ...ap, organizationId: "" }))
      .toThrow("INVALID_RECONCILIATION_SCOPE");
    expect(() => reconcileSubledgerToGl({ ...ap, subledgerMinor: -1n }))
      .toThrow("INVALID_CONTROL_BALANCE");
  });

  it("rejects duplicate control balances in one integrity assertion", () => {
    expect(() => assertSubledgerIntegrity([ap, ap]))
      .toThrow("DUPLICATE_CONTROL_BALANCE");
  });

  it("allows AP, AR and cash control accounts to reconcile together", () => {
    expect(() => assertSubledgerIntegrity([
      ap,
      { ...ap, control: "AR", subledgerMinor: 80000n, glControlMinor: 80000n },
      { ...ap, control: "CASH", subledgerMinor: 200000n, glControlMinor: 200000n },
    ])).not.toThrow();
  });
});
