import { assertSubledgerIntegrity, type SubledgerBalance, type SubledgerControl } from "./subledger-integrity";
import { assertTrialBalance, type TrialBalanceRow } from "./trial-balance";

export type DWaveScope = Readonly<{
  organizationId: string;
  legalEntityId: string;
  periodId: string;
  currency: string;
}>;

export type ControlSnapshot = DWaveScope & Readonly<{
  control: SubledgerControl;
  asOf: string;
  subledgerMinor: bigint;
  glControlMinor: bigint;
}>;

export type LineageRecord = DWaveScope & Readonly<{
  control: SubledgerControl;
  sourceId: string;
  subledgerId: string;
  journalId: string;
  ledgerEntryId: string;
}>;

export type IntegrityException = Readonly<{
  code: string;
  control?: SubledgerControl;
  differenceMinor?: bigint;
}>;

export type DWaveCertification = Readonly<{
  status: "PASS" | "BLOCKED";
  exceptions: readonly IntegrityException[];
  blockedBy: readonly ("C_WAVE")[];
}>;

function validScope(scope: DWaveScope): boolean {
  return Boolean(scope.organizationId.trim() && scope.legalEntityId.trim() &&
    scope.periodId.trim() && /^[A-Z]{3}$/.test(scope.currency));
}

export function createControlSnapshot(input: ControlSnapshot): ControlSnapshot {
  if (!validScope(input) || !input.asOf.trim()) throw new Error("INVALID_CONTROL_SNAPSHOT");
  if (input.subledgerMinor < 0n || input.glControlMinor < 0n) throw new Error("INVALID_CONTROL_BALANCE");
  return Object.freeze({ ...input });
}

export function assertCommonScope(
  expected: DWaveScope,
  snapshots: readonly ControlSnapshot[],
): void {
  if (!validScope(expected)) throw new Error("INVALID_D_WAVE_SCOPE");
  for (const item of snapshots) {
    if (item.organizationId !== expected.organizationId) throw new Error("TENANT_MISMATCH");
    if (item.legalEntityId !== expected.legalEntityId) throw new Error("ENTITY_MISMATCH");
    if (item.periodId !== expected.periodId) throw new Error("PERIOD_MISMATCH");
    if (item.currency !== expected.currency) throw new Error("CURRENCY_MISMATCH");
  }
}

export function detectOrphanTrialBalanceAccounts(
  rows: readonly TrialBalanceRow[],
  knownAccountIds: readonly string[],
): string[] {
  const known = new Set(knownAccountIds);
  return [...new Set(rows.filter(row => !known.has(row.accountId)).map(row => row.accountId))].sort();
}

export function assertCompleteLineage(records: readonly LineageRecord[]): void {
  const seenLedgerEntries = new Set<string>();
  for (const record of records) {
    if (!validScope(record) || !record.sourceId.trim() || !record.subledgerId.trim() ||
        !record.journalId.trim() || !record.ledgerEntryId.trim()) {
      throw new Error("INCOMPLETE_ACCOUNTING_LINEAGE");
    }
    if (seenLedgerEntries.has(record.ledgerEntryId)) throw new Error("DUPLICATE_LEDGER_LINEAGE");
    seenLedgerEntries.add(record.ledgerEntryId);
  }
}

export function certifyDWave(input: Readonly<{
  scope: DWaveScope;
  snapshots: readonly ControlSnapshot[];
  trialBalance: readonly TrialBalanceRow[];
  knownAccountIds: readonly string[];
  lineage: readonly LineageRecord[];
  requireBankReconciliation?: boolean;
}>): DWaveCertification {
  const exceptions: IntegrityException[] = [];
  assertCommonScope(input.scope, input.snapshots);

  for (const snapshot of input.snapshots) {
    const balance: SubledgerBalance = {
      control: snapshot.control,
      organizationId: snapshot.organizationId,
      legalEntityId: snapshot.legalEntityId,
      periodId: snapshot.periodId,
      currency: snapshot.currency,
      subledgerMinor: snapshot.subledgerMinor,
      glControlMinor: snapshot.glControlMinor,
    };
    const differenceMinor = balance.subledgerMinor - balance.glControlMinor;
    if (differenceMinor !== 0n) {
      exceptions.push({ code: `${balance.control}_GL_OUT_OF_BALANCE`, control: balance.control, differenceMinor });
    }
  }

  try { assertSubledgerIntegrity(input.snapshots); }
  catch (error) {
    if (exceptions.length === 0) exceptions.push({ code: error instanceof Error ? error.message : "SUBLEDGER_INTEGRITY_FAILED" });
  }
  try { assertTrialBalance(input.trialBalance); }
  catch { exceptions.push({ code: "TRIAL_BALANCE_OUT_OF_BALANCE" }); }

  const orphans = detectOrphanTrialBalanceAccounts(input.trialBalance, input.knownAccountIds);
  for (const accountId of orphans) exceptions.push({ code: `ORPHAN_ACCOUNT:${accountId}` });

  try { assertCompleteLineage(input.lineage); }
  catch (error) { exceptions.push({ code: error instanceof Error ? error.message : "LINEAGE_FAILED" }); }

  const blockedBy = input.requireBankReconciliation ? ["C_WAVE"] as const : [];
  return {
    status: exceptions.length === 0 && blockedBy.length === 0 ? "PASS" : "BLOCKED",
    exceptions,
    blockedBy,
  };
}
