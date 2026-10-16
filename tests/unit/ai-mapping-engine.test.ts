import { describe, expect, it, vi } from "vitest";
import { mapTransaction, type MappingContext } from "../../src/lib/accounting/ai-mapping-engine";

const input = {
  tenantId: "tenant-a", transactionId: "tx-1", sourceHash: "sha256-1",
  description: "Software subscription", amountMinor: 24000n, currency: "USD",
  date: "2026-10-15", type: "EXPENSE" as const, evidenceIds: ["doc-1"],
};
const context = (): MappingContext => ({
  policy: { sector: "PRIVATE", framework: "US_GAAP", jurisdiction: "US-TX", version: "v1", effectiveFrom: "2026-01-01" },
  modelVersion: "test-model-v1",
  candidates: [{ id: "expense-1", tenantId: "tenant-a", active: true, permittedTypes: ["EXPENSE"] }],
  propose: vi.fn(async () => ({ accountId: "expense-1", confidence: 0.95, explanation: "Matching subscription" })),
});
describe("governed AI mapping", () => {
  it("prepares but never posts a valid high-confidence proposal", async () => {
    const decision = await mapTransaction(input, context());
    expect(decision).toMatchObject({ accountId: "expense-1", route: "AUTO_PREPARE", status: "PROPOSED", agent: "BOOKKEEPING" });
    expect(decision.idempotencyKey).toContain("tenant-a:tx-1:");
  });
  it("rejects cross-tenant account suggestions", async () => {
    const ctx = context();
    ctx.candidates = [{ id: "foreign", tenantId: "tenant-b", active: true, permittedTypes: ["EXPENSE"] }];
    ctx.propose = vi.fn();
    const result = await mapTransaction(input, ctx);
    expect(result.route).toBe("EXCEPTION");
    expect(ctx.propose).not.toHaveBeenCalled();
  });
  it("rejects hallucinated account identifiers", async () => {
    const ctx = context();
    ctx.propose = async () => ({ accountId: "invented", confidence: 1, explanation: "Guess" });
    expect((await mapTransaction(input, ctx)).route).toBe("EXCEPTION");
  });
  it("routes medium confidence for human review", async () => {
    const ctx = context();
    ctx.propose = async () => ({ accountId: "expense-1", confidence: 0.75, explanation: "Uncertain" });
    expect((await mapTransaction(input, ctx)).route).toBe("HUMAN_REVIEW");
  });
  it("fails closed when the model response is invalid", async () => {
    const ctx = context();
    ctx.propose = async () => ({ accountId: "expense-1", confidence: 7 });
    expect((await mapTransaction(input, ctx)).route).toBe("EXCEPTION");
  });
  it("rejects out-of-period accounting policies", async () => {
    const ctx = context();
    ctx.policy.effectiveTo = "2026-09-30";
    await expect(mapTransaction(input, ctx)).rejects.toThrow("ACCOUNTING_POLICY_NOT_EFFECTIVE");
  });
  it("requires source evidence", async () => {
    await expect(mapTransaction({ ...input, evidenceIds: [] }, context())).rejects.toThrow();
  });
});
