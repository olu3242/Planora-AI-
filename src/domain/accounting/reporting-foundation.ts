import { createHash } from "node:crypto";
import { z } from "zod";
import { AccountingPolicyInput, type AccountingPolicy } from "@/lib/accounting/ai-native-controls";
import { assertTrialBalance, type TrialBalanceRow } from "./trial-balance";
import { validateJournal } from "./journal-validation";
import { createReversalLines } from "./reversal";

// Eligibility and statement-routing examples, never a standards-compliance certification.
const statementNames = {
  IFRS: ["financial_position", "profit_or_loss_and_oci", "cash_flows", "changes_in_equity"],
  US_GAAP: ["balance_sheet", "income_statement", "cash_flows", "equity"],
  GASB: ["government_wide", "governmental_funds", "fund_reconciliation"],
  FASAB: ["balance_sheet", "net_cost", "changes_in_net_position", "budgetary_resources"],
  IPSAS: ["financial_position", "financial_performance", "cash_flows", "net_assets"],
  IFRS_FOR_SMES: ["financial_position", "comprehensive_income", "cash_flows", "equity"],
  UK_GAAP: ["balance_sheet", "profit_and_loss", "cash_flows", "equity"],
} as const;

const amount = z.string().regex(/^-?\d+$/);
export const ReportingManifest = z.object({
  policy: AccountingPolicyInput,
  mappings: z.record(z.string().min(1), z.object({ statement: z.string().min(1), section: z.string().trim().min(1) })),
});
export type ReportingManifestInput = z.infer<typeof ReportingManifest>;
export const CloseEvidence = z.object({
  expected: z.array(z.object({ statement: z.string(), section: z.string(), amountMinor: amount, reference: z.string().trim().min(1) })).min(1),
  reconciliations: z.array(z.object({ accountId: z.string().min(1), externalBalanceMinor: amount, reference: z.string().trim().min(1) })).min(1),
});

export function frameworkContract(policy: AccountingPolicy) {
  const validated = AccountingPolicyInput.parse(policy);
  if (validated.framework === "LOCAL") throw new Error("LOCAL_FRAMEWORK_CONTRACT_REQUIRED");
  return { framework: validated.framework, version: validated.version,
    requiredStatements: [...statementNames[validated.framework]], certification: "NOT_CERTIFIED" as const };
}

/** Maps canonical trial-balance rows; does not recalculate or post a second ledger. */
export function mapFrameworkDraft(rows: readonly TrialBalanceRow[], input: unknown) {
  const manifest = ReportingManifest.parse(input);
  const contract = frameworkContract(manifest.policy);
  assertTrialBalance(rows);
  const seen = new Set<string>();
  const sections = new Map<string, { statement: string; section: string; amountMinor: bigint }>();
  for (const row of rows) {
    if (seen.has(row.accountId) || row.debitMinor < 0n || row.creditMinor < 0n || (row.debitMinor > 0n && row.creditMinor > 0n)) throw new Error("INVALID_TRIAL_BALANCE_ROW");
    seen.add(row.accountId);
    const mapping = manifest.mappings[row.accountId];
    if (!mapping || !(contract.requiredStatements as readonly string[]).includes(mapping.statement)) throw new Error("FRAMEWORK_MAPPING_REQUIRED");
    const key = JSON.stringify([mapping.statement, mapping.section]);
    const prior = sections.get(key)?.amountMinor ?? 0n;
    sections.set(key, { ...mapping, amountMinor: prior + row.debitMinor - row.creditMinor });
  }
  return { contract, sections: [...sections.values()].sort((a, b) => JSON.stringify([a.statement,a.section]).localeCompare(JSON.stringify([b.statement,b.section]))),
    status: "DRAFT_UNCERTIFIED" as const };
}

export function verifyCloseEvidence(rows: readonly TrialBalanceRow[], draft: ReturnType<typeof mapFrameworkDraft>, input: unknown) {
  const evidence = CloseEvidence.parse(input);
  const expected = new Map<string, string>();
  for (const item of evidence.expected) {
    const key = JSON.stringify([item.statement, item.section]);
    if (expected.has(key)) throw new Error("DUPLICATE_EXPECTED_SECTION");
    expected.set(key, item.amountMinor);
  }
  if (expected.size !== draft.sections.length || draft.sections.some(s => {
    const value = expected.get(JSON.stringify([s.statement, s.section]));
    return value === undefined || BigInt(value) !== s.amountMinor;
  })) throw new Error("EXPECTED_REPORTING_AMOUNTS_MISMATCH");
  const external = new Map<string, string>();
  for (const item of evidence.reconciliations) {
    if (external.has(item.accountId)) throw new Error("DUPLICATE_RECONCILIATION");
    external.set(item.accountId, item.externalBalanceMinor);
  }
  if (external.size !== rows.length || rows.some(row => {
    const value = external.get(row.accountId);
    return value === undefined || BigInt(value) !== row.debitMinor - row.creditMinor;
  })) throw new Error("CLOSE_RECONCILIATION_MISMATCH");
  return evidence;
}

/** The canonical rows are sorted so reordering a query cannot invalidate a snapshot. */
export function ledgerSnapshotHash(rows: readonly TrialBalanceRow[]) {
  return createHash("sha256").update(JSON.stringify([...rows].sort((a,b) => a.accountId.localeCompare(b.accountId))
    .map(r => [r.accountId, r.debitMinor.toString(), r.creditMinor.toString()]))).digest("hex");
}

export function proposeExpenseAccrual(expenseAccountId: string, liabilityAccountId: string, amountMinor: bigint, sourceReference: string) {
  if (!sourceReference.trim() || amountMinor <= 0n || expenseAccountId === liabilityAccountId) throw new Error("INVALID_ACCRUAL_PROPOSAL");
  const lines = [{ accountId: expenseAccountId, debitMinor: amountMinor, creditMinor: 0n },
    { accountId: liabilityAccountId, debitMinor: 0n, creditMinor: amountMinor }];
  validateJournal(lines);
  return { status: "PROPOSED_REQUIRES_APPROVAL" as const, sourceReference, lines, reversalLines: createReversalLines(lines) };
}
