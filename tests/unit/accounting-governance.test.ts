import { describe, expect, it } from "vitest";
import { validateAccountingProposal, validateProposalDecision } from "../../src/domain/accounting/agent-proposal";
import { accountingReleaseGates, classifyAccountingRelease } from "../../src/domain/accounting/certification-gates";
const proposal = {
  id: "p1", organizationId: "org1", sourceReference: "bank-1", proposedAccountId: "acct1",
  rationale: "Vendor classification", evidenceReferences: ["statement-1"], confidenceBasisPoints: 8500,
};
describe("AI accounting governance", () => {
  it("requires grounded proposal evidence", () => expect(() => validateAccountingProposal(proposal)).not.toThrow());
  it("rejects unsupported proposals", () => expect(() => validateAccountingProposal({ ...proposal, evidenceReferences: [] })).toThrow("INCOMPLETE_PROPOSAL_EVIDENCE"));
  it("rejects invalid confidence", () => expect(() => validateAccountingProposal({ ...proposal, confidenceBasisPoints: 10001 })).toThrow("INVALID_CONFIDENCE"));
  it("requires scoped reviewer decisions", () => expect(() => validateProposalDecision(proposal, {
    proposalId: "p1", organizationId: "other", reviewerId: "reviewer", action: "APPROVE", reason: "Reviewed",
  })).toThrow("PROPOSAL_SCOPE_MISMATCH"));
});
describe("accounting release governance", () => {
  it("blocks missing evidence", () => expect(classifyAccountingRelease([])).toBe("BLOCKED"));
  it("requires every certified gate", () => {
    const evidence = accountingReleaseGates.map((gate) => ({ gate, passed: true, evidence: "run-id" }));
    expect(classifyAccountingRelease(evidence)).toBe("READY_FOR_REVIEW");
    expect(classifyAccountingRelease(evidence.slice(1))).toBe("BLOCKED");
  });
});
