import { describe, expect, it, vi } from "vitest";
import { postGovernedJournal } from "../../src/lib/accounting/governed-posting";

const valid = {
  organizationId: "org", legalEntityId: "entity", fiscalPeriodId: "period",
  sourceKey: "fixture-1", currencyCode: "USD", actorId: "actor",
  lines: [
    { accountId: "cash", debitMinor: 100n, creditMinor: 0n },
    { accountId: "revenue", debitMinor: 0n, creditMinor: 100n },
  ],
  gate: {
    authenticated: true, authorized: true, tenantMatches: true, entityMatches: true,
    periodOpen: true, accountsActive: true, sourceEvidencePresent: true,
    idempotencyKeyPresent: true, policyEffective: true,
    requiresHumanApproval: true, humanApproved: true,
    agentKillSwitchEnabled: true, isAgentInitiated: true,
  },
};
describe("governed posting", () => {
  it("forwards a valid balanced journal", async () => {
    const postAtomically = vi.fn().mockResolvedValue({ journalId: "j1", created: true });
    const result = await postGovernedJournal({ postAtomically }, valid);
    expect(result.journalId).toBe("j1");
    expect(postAtomically).toHaveBeenCalledTimes(1);
  });
  it("blocks closed periods before persistence", async () => {
    const postAtomically = vi.fn();
    await expect(postGovernedJournal({ postAtomically }, {
      ...valid, gate: { ...valid.gate, periodOpen: false },
    })).rejects.toThrow("PERIOD_LOCKED");
    expect(postAtomically).not.toHaveBeenCalled();
  });
  it("blocks unbalanced journals before persistence", async () => {
    const postAtomically = vi.fn();
    await expect(postGovernedJournal({ postAtomically }, {
      ...valid, lines: [valid.lines[0], { accountId: "revenue", debitMinor: 0n, creditMinor: 99n }],
    })).rejects.toThrow("UNBALANCED_JOURNAL");
    expect(postAtomically).not.toHaveBeenCalled();
  });
});
