import { describe, expect, it } from "vitest";
import { assertPostingGate, validateJournalLines, validatePolicySelection, type PostingGate } from "../../src/lib/accounting/ai-native-controls";

const validGate: PostingGate = {
  authenticated: true, authorized: true, tenantMatches: true, entityMatches: true,
  periodOpen: true, accountsActive: true, sourceEvidencePresent: true,
  idempotencyKeyPresent: true, policyEffective: true,
  requiresHumanApproval: true, humanApproved: true,
  agentKillSwitchEnabled: true, isAgentInitiated: false,
};

describe("AI-native accounting deterministic safeguards", () => {
  it("accepts balanced entries in integer minor units", () => {
    expect(validateJournalLines([
      { accountId: "cash", debitMinor: 240000n, creditMinor: 0n },
      { accountId: "revenue", debitMinor: 0n, creditMinor: 240000n },
    ])).toEqual({ debitMinor: 240000n, creditMinor: 240000n, lineCount: 2 });
  });
  it("rejects unbalanced entries", () => {
    expect(() => validateJournalLines([
      { accountId: "cash", debitMinor: 240000n, creditMinor: 0n },
      { accountId: "revenue", debitMinor: 0n, creditMinor: 239999n },
    ])).toThrow("UNBALANCED_JOURNAL");
  });
  it("rejects zero, double-sided and negative lines", () => {
    for (const line of [
      { accountId: "x", debitMinor: 0n, creditMinor: 0n },
      { accountId: "x", debitMinor: 1n, creditMinor: 1n },
      { accountId: "x", debitMinor: -1n, creditMinor: 0n },
    ]) expect(() => validateJournalLines([line, line])).toThrow();
  });
  it("requires valid sector/framework context", () => {
    expect(() => validatePolicySelection({ sector: "PRIVATE", framework: "GASB", jurisdiction: "US-TX", version: "1", effectiveFrom: "2026-01-01" })).toThrow();
    expect(validatePolicySelection({ sector: "PUBLIC", framework: "GASB", jurisdiction: "US-TX", version: "1", effectiveFrom: "2026-01-01" }).framework).toBe("GASB");
    expect(() => validatePolicySelection({ sector: "PUBLIC", framework: "LOCAL", jurisdiction: "NG", version: "1", effectiveFrom: "2026-01-01" })).toThrow();
  });
  it("fails closed for each posting control", () => {
    assertPostingGate(validGate);
    for (const key of Object.keys(validGate) as (keyof PostingGate)[]) {
      if (key === "requiresHumanApproval" || key === "isAgentInitiated" || key === "agentKillSwitchEnabled") continue;
      expect(() => assertPostingGate({ ...validGate, [key]: false })).toThrow();
    }
  });
  it("rejects agent-initiated postings even when the kill switch is enabled", () => {
    expect(() => assertPostingGate({ ...validGate, isAgentInitiated: true })).toThrow("AGENT_POSTING_NOT_SUPPORTED");
  });
  it("permits a non-agent workflow without an agent kill switch", () => {
    expect(() => assertPostingGate({ ...validGate, isAgentInitiated: false, agentKillSwitchEnabled: false })).not.toThrow();
  });
});
