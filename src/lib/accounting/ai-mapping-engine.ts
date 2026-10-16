import { z } from "zod";
import { validatePolicySelection } from "./ai-native-controls";

export const MappingTransaction = z.object({
  tenantId: z.string().trim().min(1),
  transactionId: z.string().trim().min(1),
  sourceHash: z.string().trim().min(1),
  description: z.string().trim().min(1),
  amountMinor: z.bigint().refine(value => value !== 0n, "ZERO_AMOUNT"),
  currency: z.string().regex(/^[A-Z]{3}$/),
  date: z.iso.date(),
  type: z.enum(["EXPENSE", "INVOICE", "BANK", "ASSET"]),
  evidenceIds: z.array(z.string().min(1)).min(1),
});
export const MappingCandidate = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  active: z.boolean(),
  permittedTypes: z.array(MappingTransaction.shape.type),
});
export const MappingProposal = z.object({
  accountId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  explanation: z.string().trim().min(1),
});
export type MappingTransactionInput = z.infer<typeof MappingTransaction>;
export type MappingCandidateInput = z.infer<typeof MappingCandidate>;
export type MappingProposalInput = z.infer<typeof MappingProposal>;
export type MappingRoute = "AUTO_PREPARE" | "HUMAN_REVIEW" | "EXCEPTION";
export type MappingDecision = Readonly<{
  tenantId: string;
  transactionId: string;
  sourceHash: string;
  accountId: string | null;
  confidence: number;
  explanation: string;
  evidenceIds: string[];
  agent: "BOOKKEEPING" | "AR" | "RECONCILIATION" | "GL";
  route: MappingRoute;
  status: "PROPOSED";
  modelVersion: string;
  policyVersion: string;
  idempotencyKey: string;
}>;
export type MappingPolicy = {
  sector: "PRIVATE" | "PUBLIC" | "NOT_FOR_PROFIT";
  framework: "US_GAAP" | "IFRS" | "IFRS_FOR_SMES" | "GASB" | "IPSAS" | "LOCAL";
  jurisdiction: string;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  localAuthority?: string;
};
export type MappingContext = {
  policy: MappingPolicy;
  modelVersion: string;
  candidates: readonly MappingCandidateInput[];
  propose: (input: MappingTransactionInput, eligible: readonly MappingCandidateInput[]) => Promise<unknown>;
};
const agentFor = (type: MappingTransactionInput["type"]): MappingDecision["agent"] =>
  type === "INVOICE" ? "AR" : type === "BANK" ? "RECONCILIATION" : type === "ASSET" ? "GL" : "BOOKKEEPING";

/** Pure proposal boundary. Does not persist, authorize, or post journal entries. */
export async function mapTransaction(raw: unknown, context: MappingContext): Promise<MappingDecision> {
  const input = MappingTransaction.parse(raw);
  const policy = validatePolicySelection(context.policy);
  if (input.date < policy.effectiveFrom || (policy.effectiveTo && input.date > policy.effectiveTo)) {
    throw new Error("ACCOUNTING_POLICY_NOT_EFFECTIVE");
  }
  if (!context.modelVersion.trim()) throw new Error("MODEL_VERSION_REQUIRED");
  const eligible = context.candidates.filter(a =>
    a.tenantId === input.tenantId && a.active && a.permittedTypes.includes(input.type)
  );
  const base = {
    tenantId: input.tenantId, transactionId: input.transactionId, sourceHash: input.sourceHash,
    evidenceIds: input.evidenceIds, agent: agentFor(input.type), status: "PROPOSED" as const,
    modelVersion: context.modelVersion, policyVersion: policy.version,
    idempotencyKey: [input.tenantId, input.transactionId, input.sourceHash, policy.version, context.modelVersion].join(":"),
  };
  if (!eligible.length) return { ...base, accountId: null, confidence: 0, explanation: "No eligible account", route: "EXCEPTION" };
  let proposed: MappingProposalInput;
  try {
    proposed = MappingProposal.parse(await context.propose(input, eligible));
  } catch {
    return { ...base, accountId: null, confidence: 0, explanation: "Invalid or unavailable AI proposal", route: "EXCEPTION" };
  }
  if (!eligible.some(a => a.id === proposed.accountId)) {
    return { ...base, accountId: null, confidence: proposed.confidence, explanation: "Proposed account not eligible", route: "EXCEPTION" };
  }
  const route: MappingRoute = proposed.confidence >= 0.9 ? "AUTO_PREPARE" : proposed.confidence >= 0.7 ? "HUMAN_REVIEW" : "EXCEPTION";
  return { ...base, accountId: proposed.accountId, confidence: proposed.confidence, explanation: proposed.explanation, route };
}
