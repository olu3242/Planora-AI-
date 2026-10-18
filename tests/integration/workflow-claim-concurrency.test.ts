import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createWorkflowRun } from "../../src/lib/orchestration/engine";
import { claimReadyWorkflowRun } from "../../src/lib/orchestration/postgres-run-claim";

if (process.env.APP_ENV !== "test" || !process.env.TEST_DATABASE_URL) {
  throw new Error("Isolated test database required for workflow claim integration");
}

const db = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });
const createdRuns: string[] = [];
afterAll(async () => {
  if (createdRuns.length) {
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
      Array.from({ length: 10 }, () => claimReadyWorkflowRun(db, request)),
    );
    expect(outcomes.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((item) => item.status === "rejected")).toHaveLength(9);
    const stored = await db.workflowRunRecord.findUniqueOrThrow({ where: { id: runId } });
    expect(stored.status).toBe("RUNNING");
    expect((stored.state as { status: string }).status).toBe("RUNNING");
  });
});
