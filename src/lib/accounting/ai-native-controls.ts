import { z } from "zod";

/** Pure deterministic controls. No model inference or database mutation. */
export const AccountingSector = z.enum(["PRIVATE", "PUBLIC", "NOT_FOR_PROFIT"]);
export const AccountingFramework = z.enum(["US_GAAP", "IFRS", "IFRS_FOR_SMES", "GASB", "FASAB", "IPSAS", "UK_GAAP", "LOCAL"]);
export const AccountingPolicyInput = z.object({
  sector: AccountingSector,
  framework: AccountingFramework,
  jurisdiction: z.string().trim().min(2),
  version: z.string().trim().min(1),
  effectiveFrom: z.iso.date(),
  effectiveTo: z.iso.date().optional(),
  localAuthority: z.string().trim().min(1).optional(),
  subtype: z.enum(["state_local", "federal"]).optional(),
}).superRefine((policy, ctx) => {
  if (policy.effectiveTo && policy.effectiveTo < policy.effectiveFrom) {
    ctx.addIssue({ code: "custom", message: "End date precedes start date", path: ["effectiveTo"] });
  }
  if (policy.framework === "LOCAL" && !policy.localAuthority) {
    ctx.addIssue({ code: "custom", message: "Local framework requires authority", path: ["localAuthority"] });
  }
  if (policy.framework === "GASB" && !(policy.sector === "PUBLIC" && /^US(?:-|$)/.test(policy.jurisdiction.toUpperCase()) && policy.subtype === "state_local")) {
    ctx.addIssue({ code: "custom", message: "GASB requires US public-sector context", path: ["framework"] });
  }
  if (policy.framework === "FASAB" && !(policy.sector === "PUBLIC" && /^US(?:-|$)/.test(policy.jurisdiction.toUpperCase()) && policy.subtype === "federal")) {
    ctx.addIssue({ code: "custom", message: "FASAB requires US federal public-sector context", path: ["framework"] });
  }
  if (policy.framework === "US_GAAP" && (policy.sector === "PUBLIC" || !/^US(?:-|$)/.test(policy.jurisdiction.toUpperCase()))) {
    ctx.addIssue({ code: "custom", message: "US GAAP requires US private or nonprofit context", path: ["framework"] });
  }
  if (["IFRS", "UK_GAAP"].includes(policy.framework) && policy.sector === "PUBLIC") {
    ctx.addIssue({ code: "custom", message: "Framework requires private or nonprofit context", path: ["framework"] });
  }
  if (policy.framework === "UK_GAAP" && !/^(GB|IE)(?:-|$)/.test(policy.jurisdiction.toUpperCase())) {
    ctx.addIssue({ code: "custom", message: "UK GAAP routing requires GB or IE context", path: ["framework"] });
  }
  if (policy.framework === "IPSAS" && policy.sector !== "PUBLIC") {
    ctx.addIssue({ code: "custom", message: "IPSAS requires public-sector context", path: ["framework"] });
  }
  if (policy.framework === "IFRS_FOR_SMES" && policy.sector !== "PRIVATE") {
    ctx.addIssue({ code: "custom", message: "IFRS for SMEs requires private-sector context", path: ["framework"] });
  }
});
export type AccountingPolicy = z.infer<typeof AccountingPolicyInput>;

export function validatePolicySelection(input: unknown): AccountingPolicy {
  return AccountingPolicyInput.parse(input);
}

export type JournalLineInput = Readonly<{
  accountId: string;
  debitMinor: bigint;
  creditMinor: bigint;
}>;
export type JournalValidation = Readonly<{
  debitMinor: bigint;
  creditMinor: bigint;
  lineCount: number;
}>;

/** Minor-unit integer arithmetic is exact; caller must supply currency-correct minor units. */
export function validateJournalLines(lines: readonly JournalLineInput[]): JournalValidation {
  if (lines.length < 2) throw new Error("JOURNAL_REQUIRES_TWO_LINES");
  let debitMinor = 0n;
  let creditMinor = 0n;
  for (const line of lines) {
    if (!line.accountId.trim()) throw new Error("ACCOUNT_REQUIRED");
    if (line.debitMinor < 0n || line.creditMinor < 0n) throw new Error("NEGATIVE_POSTING");
    if ((line.debitMinor > 0n) === (line.creditMinor > 0n)) throw new Error("INVALID_LINE_SIDE");
    debitMinor += line.debitMinor;
    creditMinor += line.creditMinor;
  }
  if (debitMinor !== creditMinor) throw new Error("UNBALANCED_JOURNAL");
  return { debitMinor, creditMinor, lineCount: lines.length };
}

export type PostingGate = Readonly<{
  authenticated: boolean;
  authorized: boolean;
  tenantMatches: boolean;
  entityMatches: boolean;
  periodOpen: boolean;
  accountsActive: boolean;
  sourceEvidencePresent: boolean;
  idempotencyKeyPresent: boolean;
  policyEffective: boolean;
  requiresHumanApproval: boolean;
  humanApproved: boolean;
  agentKillSwitchEnabled: boolean;
  isAgentInitiated: boolean;
}>;

export function assertPostingGate(gate: PostingGate): void {
  const checks: [boolean, string][] = [
    [gate.authenticated, "AUTHENTICATION_REQUIRED"],
    [gate.authorized, "POSTING_NOT_AUTHORIZED"],
    [gate.tenantMatches, "TENANT_MISMATCH"],
    [gate.entityMatches, "ENTITY_MISMATCH"],
    [gate.periodOpen, "PERIOD_LOCKED"],
    [gate.accountsActive, "INACTIVE_ACCOUNT"],
    [gate.sourceEvidencePresent, "SOURCE_EVIDENCE_REQUIRED"],
    [gate.idempotencyKeyPresent, "IDEMPOTENCY_KEY_REQUIRED"],
    [gate.policyEffective, "ACCOUNTING_POLICY_NOT_EFFECTIVE"],
    [!gate.requiresHumanApproval || gate.humanApproved, "HUMAN_APPROVAL_REQUIRED"],
    [!gate.isAgentInitiated, "AGENT_POSTING_NOT_SUPPORTED"],
  ];
  for (const [ok, error] of checks) if (!ok) throw new Error(error);
}
