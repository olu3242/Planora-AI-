import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { runBookkeepingCleanup } from "@/application/accounting/bookkeeping-cleanup-service";

const db = new PrismaClient();
afterAll(() => db.$disconnect());
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
  expect(stored.result).toMatchObject({ batchId: context.batchId, findings: expect.any(Array) });
 });
 it("replays the same request without creating another execution", async () => {
  const { context, rows } = await setup();
  const first = await runBookkeepingCleanup(context, rows);
  const second = await runBookkeepingCleanup(context, rows);
  expect(second.duplicate).toBe(true);
  expect(second.executionId).toBe(first.executionId);
  expect(second.value).toBeNull();
  expect(await db.runtimeExecution.count({ where: { organizationId: context.organizationId, command: "BOOKKEEPING.CLEANUP_PROPOSE", idempotencyKey: context.idempotencyKey } })).toBe(1);
 });
 it("rejects reuse of a key with a changed amount", async () => {
  const { context, rows } = await setup();
  await runBookkeepingCleanup(context, rows);
  await expect(runBookkeepingCleanup(context, [{ ...rows[0], amountMinor: 2000 }])).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
  expect(await db.runtimeExecution.count({ where: { organizationId: context.organizationId, command: "BOOKKEEPING.CLEANUP_PROPOSE", idempotencyKey: context.idempotencyKey } })).toBe(1);
 });
 it("rejects reuse of a key with a different batch", async () => {
  const { context, rows } = await setup();
  await runBookkeepingCleanup(context, rows);
  await expect(runBookkeepingCleanup({ ...context, batchId: context.batchId + "-other" }, rows)).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
  const saved = await db.runtimeExecution.findUniqueOrThrow({ where: { organizationId_command_idempotencyKey: { organizationId: context.organizationId, command: "BOOKKEEPING.CLEANUP_PROPOSE", idempotencyKey: context.idempotencyKey } } });
  expect(saved.targetId).toBe(context.batchId);
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
 it("isolates identical idempotency keys by organization", async () => {
  const { context, rows } = await setup();
  const foreign = await db.organization.findUniqueOrThrow({ where: { code: "HORIZON" } });
  const first = await runBookkeepingCleanup(context, rows);
  const second = await runBookkeepingCleanup({ ...context, organizationId: foreign.id }, rows.map(row => ({ ...row, organizationId: foreign.id })));
  expect(second.executionId).not.toBe(first.executionId);
  expect(second.duplicate).toBe(false);
  expect(await db.runtimeExecution.count({ where: { command: "BOOKKEEPING.CLEANUP_PROPOSE", idempotencyKey: context.idempotencyKey } })).toBe(2);
 });
 it("retains a deterministic input fingerprint", async () => {
  const { context, rows } = await setup();
  const result = await runBookkeepingCleanup(context, rows);
  const execution = await db.runtimeExecution.findUniqueOrThrow({ where: { id: result.executionId } });
  expect(execution.request).toMatchObject({ batchId: context.batchId, transactionCount: 1, inputFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) });
 });
 it("does not create a second proposal on a concurrent identical replay", async () => {
  const { context, rows } = await setup();
  const results = await Promise.all([runBookkeepingCleanup(context, rows), runBookkeepingCleanup(context, rows)]);
  expect(new Set(results.map(result => result.executionId)).size).toBe(1);
  expect(results.filter(result => result.duplicate)).toHaveLength(1);
  expect(await db.runtimeExecution.count({ where: { organizationId: context.organizationId, command: "BOOKKEEPING.CLEANUP_PROPOSE", idempotencyKey: context.idempotencyKey } })).toBe(1);
 });
 it("does not write journal records while proposing findings", async () => {
  const { context, rows } = await setup();
  const before = await db.journalEntry.count({ where: { organizationId: context.organizationId } });
  await runBookkeepingCleanup(context, rows);
  const after = await db.journalEntry.count({ where: { organizationId: context.organizationId } });
  expect(after).toBe(before);
  expect(await db.runtimeExecution.count({ where: { organizationId: context.organizationId, idempotencyKey: context.idempotencyKey, command: "BOOKKEEPING.CLEANUP_PROPOSE" } })).toBe(1);
 });
});
