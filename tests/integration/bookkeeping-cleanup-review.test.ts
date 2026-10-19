import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { decideBookkeepingCleanupFinding } from "@/application/accounting/bookkeeping-cleanup-decisions";
import { getBookkeepingCleanupReviewState } from "@/application/accounting/bookkeeping-cleanup-review-state";

const db = new PrismaClient();
afterAll(() => db.$disconnect());
const findings = [{ transactionId: "tx-1", kind: "DUPLICATE_CANDIDATE", relatedTransactionId: "tx-0", reason: "Same amount and reference", requiresReview: true }];
async function fixture() {
  const org = await db.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } });
  const foreign = await db.organization.findUniqueOrThrow({ where: { code: "HORIZON" } });
  const proposer = await db.user.findUniqueOrThrow({ where: { email: "analyst@planora.local" } });
  const reviewer = await db.user.findUniqueOrThrow({ where: { email: "director@planora.local" } });
  const execution = await db.runtimeExecution.create({ data: {
    organizationId: org.id, actorId: proposer.id, correlationId: randomUUID(), idempotencyKey: randomUUID(),
    command: "BOOKKEEPING.CLEANUP_PROPOSE", targetId: randomUUID(), status: "SUCCEEDED",
    request: { batchId: "integration" }, result: { batchId: "integration", findings },
  } });
  return { org, foreign, proposer, reviewer, execution };
}
const decision = (executionId: string) => ({ executionId, transactionId: "tx-1", kind: "DUPLICATE_CANDIDATE" as const, decision: "ACCEPT_FINDING" as const, reason: "Validated source evidence" });
describe("bookkeeping cleanup PostgreSQL review", () => {
  it("persists a decision and exposes it in review state", async () => {
    const f = await fixture();
    const ctx = { organizationId: f.org.id, actorId: f.reviewer.id, role: "FPA_DIRECTOR" as const, correlationId: randomUUID() };
    const result = await decideBookkeepingCleanupFinding(ctx, decision(f.execution.id));
    expect(result.reviewId).toBeTruthy();
    const state = await getBookkeepingCleanupReviewState({ organizationId: f.org.id, role: "FPA_DIRECTOR" }, f.execution.id);
    expect(state.findings[0].review.status).toBe("ACCEPT_FINDING");
    await expect(decideBookkeepingCleanupFinding(ctx, decision(f.execution.id))).rejects.toThrow();
  });
  it("serializes concurrent decisions for the same finding", async () => {
    const f = await fixture();
    const ctx = { organizationId: f.org.id, actorId: f.reviewer.id, role: "FPA_DIRECTOR" as const, correlationId: randomUUID() };
    const results = await Promise.allSettled([
      decideBookkeepingCleanupFinding(ctx, decision(f.execution.id)),
      decideBookkeepingCleanupFinding(ctx, decision(f.execution.id)),
    ]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(1);
    const events = await db.auditEvent.count({ where: {
      organizationId: f.org.id, entityType: "BookkeepingCleanupFinding",
      entityId: `${f.execution.id}:tx-1:DUPLICATE_CANDIDATE`,
      action: "BOOKKEEPING.CLEANUP_REVIEW_DECIDED",
    } });
    expect(events).toBe(1);
  });
  it("rejects an ambiguous duplicate finding identity", async () => {
    const f = await fixture();
    await db.runtimeExecution.update({ where: { id: f.execution.id }, data: {
      result: { batchId: "integration", findings: [findings[0], findings[0]] },
    } });
    await expect(decideBookkeepingCleanupFinding({
      organizationId: f.org.id, actorId: f.reviewer.id, role: "FPA_DIRECTOR", correlationId: randomUUID(),
    }, decision(f.execution.id))).rejects.toThrow(/exactly once/);
  });
  it("prevents self-review", async () => {
    const f = await fixture();
    await expect(decideBookkeepingCleanupFinding({ organizationId: f.org.id, actorId: f.proposer.id, role: "FPA_DIRECTOR", correlationId: randomUUID() }, decision(f.execution.id))).rejects.toThrow(/Separation of duties/);
  });
  it("prevents cross-tenant review", async () => {
    const f = await fixture();
    await expect(decideBookkeepingCleanupFinding({ organizationId: f.foreign.id, actorId: f.reviewer.id, role: "FPA_DIRECTOR", correlationId: randomUUID() }, decision(f.execution.id))).rejects.toThrow();
  });
  it("rejects roles without review permission", async () => {
    const f = await fixture();
    await expect(decideBookkeepingCleanupFinding({ organizationId: f.org.id, actorId: f.proposer.id, role: "ANALYST", correlationId: randomUUID() }, decision(f.execution.id))).rejects.toThrow();
  });
});
