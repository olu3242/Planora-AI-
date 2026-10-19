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
 it("rejects reuse of a key with a changed amount", async () => {
  const { context, rows } = await setup();
  await runBookkeepingCleanup(context, rows);
  await expect(runBookkeepingCleanup(context, [{ ...rows[0], amountMinor: 2000 }])).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
 });
 it("rejects reuse of a key with a different batch", async () => {
  const { context, rows } = await setup();
  await runBookkeepingCleanup(context, rows);
  await expect(runBookkeepingCleanup({ ...context, batchId: context.batchId + "-other" }, rows)).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
 });
 it("rejects cross-tenant input before runtime persistence", async () => {
  const { context, rows } = await setup();
  await expect(runBookkeepingCleanup(context, [{ ...rows[0], organizationId: randomUUID() }])).rejects.toThrow(/Cross-tenant/);
  expect(await db.runtimeExecution.count({ where: { organizationId: context.organizationId, command: "BOOKKEEPING.CLEANUP_PROPOSE", idempotencyKey: context.idempotencyKey } })).toBe(0);
 });
 it("rejects oversized batches before runtime persistence", async () => {
  const { context, rows } = await setup();
  await expect(runBookkeepingCleanup(context, Array.from({ length: 10001 }, (_, index) => ({ ...rows[0], id: String(index) })))).rejects.toThrow(/exceeds 10000/);
 });
});
