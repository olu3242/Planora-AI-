export type SubledgerControl = "AP" | "AR" | "CASH";

export type SubledgerBalance = Readonly<{
  control: SubledgerControl;
  organizationId: string;
  legalEntityId: string;
  periodId: string;
  currency: string;
  subledgerMinor: bigint;
  glControlMinor: bigint;
}>;

export type SubledgerIntegrityResult = Readonly<{
  control: SubledgerControl;
  differenceMinor: bigint;
  reconciled: boolean;
}>;

/**
 * Deterministic D-wave control-account check.
 * Inputs must be produced by authorized, tenant-scoped repository queries for
 * the same organization, legal entity, period and currency.
 *
 * CASH proves only subledger-to-GL equality here. Bank-to-cash reconciliation
 * remains a C-wave dependency and is not certified by this function.
 */
export function reconcileSubledgerToGl(
  balance: SubledgerBalance,
): SubledgerIntegrityResult {
  if (
    !balance.organizationId.trim() ||
    !balance.legalEntityId.trim() ||
    !balance.periodId.trim() ||
    !balance.currency.trim()
  ) {
    throw new Error("INVALID_RECONCILIATION_SCOPE");
  }
  if (balance.subledgerMinor < 0n || balance.glControlMinor < 0n) {
    throw new Error("INVALID_CONTROL_BALANCE");
  }

  const differenceMinor = balance.subledgerMinor - balance.glControlMinor;
  return {
    control: balance.control,
    differenceMinor,
    reconciled: differenceMinor === 0n,
  };
}

export function assertSubledgerIntegrity(
  balances: readonly SubledgerBalance[],
): void {
  const seen = new Set<SubledgerControl>();
  for (const balance of balances) {
    if (seen.has(balance.control)) throw new Error("DUPLICATE_CONTROL_BALANCE");
    seen.add(balance.control);
    const result = reconcileSubledgerToGl(balance);
    if (!result.reconciled) {
      throw new Error(`${balance.control}_GL_OUT_OF_BALANCE`);
    }
  }
}
