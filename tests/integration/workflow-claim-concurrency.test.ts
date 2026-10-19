import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { createWorkflowRun } from "../../src/lib/orchestration/engine";
import { claimReadyWorkflowRun } from "../../src/lib/orchestration/postgres-run-claim";
import { PostgresRuntimeExecutionStore } from "../../src/lib/orchestration/postgres-stores";

if (process.env.APP_ENV !== "test" || !process.env.TEST_DATABASE_URL) {
  throw new Error("Isolated test database required for workflow claim integration");
}

const db = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });
const createdRuns: string[] = [];
afterAll(async () => {
  if (createdRuns.length) {
    await db.workflowExecutionRecord.deleteMany({ where: { runId: { in: createdRuns } } });
    await db.workflowRunRecord.deleteMany({ where: { id: { in: createdRuns } } });
  }
  await db.$disconnect();
});

describe("PostgreSQL atomic workflow claim", () => {
  it("permits exactly one winner among concurrent workers and synchronizes JSON state", async () => {
    const organization = await db.organization.findFirst({ select: { id: true } });
    const actor = await db.user.findFirst({ select: { id: true } });
    if (!organization || !actor) throw new Error("WORKFLOW_TEST_FIXTURE_MISSING");
    const runId = randomUUID();
    createdRuns.push(runId);
    const definition = { id: "integration-claim", version: 1, steps: [] };
    const expectedRun = createWorkflowRun(runId, definition, {
      organizationId: organization.id,
      actorId: actor.id,
      correlationId: randomUUID(),
    });
    await db.workflowRunRecord.create({
      data: {
        id: runId,
        organizationId: organization.id,
        actorId: actor.id,
        definitionId: definition.id,
        definitionVersion: definition.version,
        status: expectedRun.status,
        state: JSON.parse(JSON.stringify(expectedRun)),
      },
    });
    const request = {
      organizationId: organization.id,
      runId,
      definitionId: definition.id,
      definitionVersion: definition.version,
      expectedRun,
    };
    const outcomes = await Promise.allSettled(
      Array.from({ length: 10 }, () => claimReadyWorkflowRun({
        workflowRunRecord: {
          updateMany: ({ where, data }) => {
            if (!where.state || !data.state) throw new Error("WORKFLOW_CLAIM_SNAPSHOT_REQUIRED");
            return db.workflowRunRecord.updateMany({
            where: {
              ...where,
              state: { equals: JSON.parse(JSON.stringify(where.state.equals)) as Prisma.InputJsonValue },
            },
            data: {
              ...data,
              state: JSON.parse(JSON.stringify(data.state)) as Prisma.InputJsonValue,
            },
            });
          },
        },
      }, request)),
    );
    expect(outcomes.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((item) => item.status === "rejected")).toHaveLength(9);
    const stored = await db.workflowRunRecord.findUniqueOrThrow({ where: { id: runId } });
    expect(stored.status).toBe("RUNNING");
    expect((stored.state as { status: string }).status).toBe("RUNNING");
  });
  it("allows only one concurrent completion of an execution record", async () => {
    const organization = await db.organization.findFirst({ select: { id: true } });
    const actor = await db.user.findFirst({ select: { id: true } });
    if (!organization || !actor) throw new Error("WORKFLOW_TEST_FIXTURE_MISSING");
    const runId = randomUUID();
    createdRuns.push(runId);
    const definition = { id: "integration-execution-cas", version: 1, steps: [] };
    const run = createWorkflowRun(runId, definition, {
      organizationId: organization.id,
      actorId: actor.id,
      correlationId: randomUUID(),
    });
    await db.workflowRunRecord.create({
      data: {
        id: runId,
        organizationId: organization.id,
        actorId: actor.id,
        definitionId: definition.id,
        definitionVersion: definition.version,
        status: run.status,
        state: JSON.parse(JSON.stringify(run)),
      },
    });
    const key = [organization.id, runId, definition.version, "post"].join(":");
    await db.workflowExecutionRecord.create({
      data: {
        idempotencyKey: key, runId, stepId: "post",
        status: "RUNNING", attempts: 1,
      },
    });
    const store = new PostgresRuntimeExecutionStore(db, organization.id);
    const outcomes = await Promise.allSettled(
      Array.from({ length: 10 }, (_, index) => store.save({
        idempotencyKey: key,
        runId,
        stepId: "post",
        status: "SUCCEEDED",
        attempts: 1,
        evidenceId: "evidence-" + index,
      })),
    );
    expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((result) => result.status === "rejected")).toHaveLength(9);
    const stored = await db.workflowExecutionRecord.findUniqueOrThrow({
      where: { idempotencyKey: key },
    });
    expect(stored.status).toBe("SUCCEEDED");
    expect(stored.evidenceId).toMatch(/^evidence-[0-9]$/);
    await expect(store.save({
      idempotencyKey: key, runId, stepId: "post",
      status: "RETRYING", attempts: 2,
    })).rejects.toThrow("WORKFLOW_SCOPE_EXECUTION_TERMINAL_IMMUTABLE");
  });

});
