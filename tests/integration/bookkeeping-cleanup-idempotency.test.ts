import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { runBookkeepingCleanup } from "@/application/accounting/bookkeeping-cleanup-service";

const db = new PrismaClient();
const row = { id: "tx-1", date: "2026-10-19", amountMinor: 1000, currency: "NGN", description: "Office rent" };
async function setup() {
 const org = await db.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } });
 const actor = await db.user.findUniqueOrThrow({ where: { email: "analyst@planora.local" } });
 const key = randomUUID();
 const batchId = "cleanup-" + randomUUID();
 const context = { organizationId: org.id, actorId: actor.id, correlationId: randomUUID(), idempotencyKey: key, batchId };
 const rows = [{ ...row, organizationId: org.id }];
 return { org, actor, context, rows };
}
describe("bookkeeping cleanup PostgreSQL idempotency", () => {
 it("persists a new proposal execution", async () => {
  const { context, rows } = await setup();
  const result = await runBookkeepingCleanup(context, rows);
  expect(result.duplicate).toBe(false);
  expect(result.status).toMatch(/SUCCEEDED|RECOVERED/);
  const stored = await db.runtimeExecution.findUniqueOrThrow({ where: { id: result.executionId } });
  expect(stored.organizationId).toBe(context.organizationId);
  expect(stored.command).toBe("BOOKKEEPING.CLEANUP_PROPOSE");
 });
 it("replays the same request without creating another execution", async () => {
  const { context, rows } = await setup();
  const first = await runBookkeepingCleanup(context, rows);
  const second = await runBookkeepingCleanup(context, rows);
  expect(second.duplicate).toBe(true);
  expect(second.executionId).toBe(first.executionId);
 });
});
