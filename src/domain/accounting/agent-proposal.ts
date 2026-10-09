/** AI output is an untrusted suggestion. No posting or payment authority. */
export type AccountingProposal = Readonly<{
  id: string;
  organizationId: string;
  sourceReference: string;
  proposedAccountId: string;
  rationale: string;
  evidenceReferences: readonly string[];
  confidenceBasisPoints: number;
}>;
export type ProposalDecision = Readonly<{
  proposalId: string;
  organizationId: string;
  reviewerId: string;
  action: "APPROVE" | "REJECT";
  reason: string;
}>;
export function validateAccountingProposal(p: AccountingProposal): void {
  if (!p.id.trim() || !p.organizationId.trim() || !p.sourceReference.trim() ||
      !p.proposedAccountId.trim() || !p.rationale.trim() ||
      p.evidenceReferences.length === 0 || p.evidenceReferences.some((e) => !e.trim())) {
    throw new Error("INCOMPLETE_PROPOSAL_EVIDENCE");
  }
  if (!Number.isInteger(p.confidenceBasisPoints) ||
      p.confidenceBasisPoints < 0 || p.confidenceBasisPoints > 10000) {
    throw new Error("INVALID_CONFIDENCE");
  }
}
export function validateProposalDecision(p: AccountingProposal, d: ProposalDecision): void {
  validateAccountingProposal(p);
  if (p.id !== d.proposalId || p.organizationId !== d.organizationId) throw new Error("PROPOSAL_SCOPE_MISMATCH");
  if (!d.reviewerId.trim() || !d.reason.trim()) throw new Error("REVIEWER_REASON_REQUIRED");
}
