import { describe, expect, it } from "vitest";
import { frameworkContract, ledgerSnapshotHash, mapFrameworkDraft, proposeExpenseAccrual, verifyCloseEvidence } from "@/domain/accounting/reporting-foundation";
import { validatePolicySelection } from "@/lib/accounting/ai-native-controls";

const policy = { sector: "PRIVATE" as const, framework: "US_GAAP" as const, jurisdiction: "US", version: "2026.1", effectiveFrom: "2026-01-01" };
const rows = [{ accountId: "cash", debitMinor: 10000n, creditMinor: 0n }, { accountId: "capital", debitMinor: 0n, creditMinor: 10000n }];
const manifest = { policy, mappings: { cash: { statement: "balance_sheet", section: "assets" }, capital: { statement: "balance_sheet", section: "equity" } } };
const evidence = { expected: [
  { statement: "balance_sheet", section: "assets", amountMinor: "10000", reference: "bank:1" },
  { statement: "balance_sheet", section: "equity", amountMinor: "-10000", reference: "capital:1" },
], reconciliations: [
  { accountId: "cash", externalBalanceMinor: "10000", reference: "bank:1" },
  { accountId: "capital", externalBalanceMinor: "-10000", reference: "capital:1" },
] };

describe("canonical reporting foundation", () => {
  it("routes federal and state/local frameworks without claiming compliance", () => {
    expect(frameworkContract({ ...policy, sector: "PUBLIC", framework: "FASAB", subtype: "federal" })).toMatchObject({ certification: "NOT_CERTIFIED" });
    expect(() => frameworkContract({ ...policy, sector: "PUBLIC", framework: "FASAB", subtype: "state_local" })).toThrow();
    expect(() => validatePolicySelection({ ...policy, framework: "GASB", sector: "PUBLIC", jurisdiction: "USXYZ", subtype: "state_local" })).toThrow();
    expect(frameworkContract({ ...policy, framework: "UK_GAAP", jurisdiction: "GB" }).requiredStatements).toContain("profit_and_loss");
    expect(() => frameworkContract({ ...policy, framework: "UK_GAAP" })).toThrow();
  });
  it("maps exact canonical balances and requires full sourced close reconciliation", () => {
    const draft = mapFrameworkDraft(rows, manifest);
    expect(draft.sections).toEqual([
      { statement: "balance_sheet", section: "assets", amountMinor: 10000n },
      { statement: "balance_sheet", section: "equity", amountMinor: -10000n },
    ]);
    expect(verifyCloseEvidence(rows, draft, evidence)).toEqual(evidence);
    expect(() => verifyCloseEvidence(rows, draft, { ...evidence, reconciliations: evidence.reconciliations.slice(0,1) })).toThrow("CLOSE_RECONCILIATION_MISMATCH");
    expect(() => verifyCloseEvidence(rows, draft, { ...evidence, expected: [evidence.expected[0]] })).toThrow("EXPECTED_REPORTING_AMOUNTS_MISMATCH");
    expect(() => verifyCloseEvidence(rows, draft, { ...evidence, expected: [{ ...evidence.expected[0], reference: "" }] })).toThrow();
  });
  it("rejects missing mappings, duplicate rows, and unbalanced inputs", () => {
    expect(() => mapFrameworkDraft(rows, { ...manifest, mappings: {} })).toThrow("FRAMEWORK_MAPPING_REQUIRED");
    expect(() => mapFrameworkDraft([...rows, ...rows], manifest)).toThrow("INVALID_TRIAL_BALANCE_ROW");
    expect(() => mapFrameworkDraft(rows.slice(0,1), manifest)).toThrow("TRIAL_BALANCE_OUT_OF_BALANCE");
  });
  it("uses stable snapshot hashes and detects monetary changes", () => {
    expect(ledgerSnapshotHash([...rows].reverse())).toBe(ledgerSnapshotHash(rows));
    expect(ledgerSnapshotHash([{ ...rows[0], debitMinor: 10001n }, rows[1]])).not.toBe(ledgerSnapshotHash(rows));
  });
  it("prepares accrual and reversal proposals without posting", () => {
    const proposed = proposeExpenseAccrual("expense", "liability", 123456789012345678n, "invoice:1");
    expect(proposed.status).toBe("PROPOSED_REQUIRES_APPROVAL");
    expect(proposed.reversalLines[0]).toEqual({ accountId: "expense", debitMinor: 0n, creditMinor: 123456789012345678n });
    expect(() => proposeExpenseAccrual("expense", "expense", 1n, "invoice:1")).toThrow();
    expect(() => proposeExpenseAccrual("expense", "liability", 1n, "")).toThrow();
  });
});
