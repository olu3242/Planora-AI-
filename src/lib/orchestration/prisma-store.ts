import "server-only";
import { prisma } from "@/lib/prisma";
import type { RuntimeExecutionRecord, RuntimeExecutionStore, WorkflowRunStore } from "./runtime";
import type { WorkflowRun } from "./types";

// Durable adapter contract. Prisma models/migration remain pending until schema validation.
export class PrismaWorkflowRunStore implements WorkflowRunStore {
  async load(runId: string): Promise<WorkflowRun | null> {
    const client=prisma as unknown as { workflowRunRecord:{findUnique(args:unknown):Promise<{state:unknown}|null>} };
    const row=await client.workflowRunRecord.findUnique({where:{id:runId}});
    return (row?.state as WorkflowRun|undefined) ?? null;
  }
  async save(run: WorkflowRun): Promise<void> {
    const client=prisma as unknown as { workflowRunRecord:{upsert(args:unknown):Promise<unknown>} };
    await client.workflowRunRecord.upsert({where:{id:run.id},create:{id:run.id,organizationId:run.context.organizationId,definitionId:run.definitionId,definitionVersion:run.definitionVersion,status:run.status,state:run},update:{status:run.status,state:run}});
  }
}
export class PrismaRuntimeExecutionStore implements RuntimeExecutionStore {
  async load(idempotencyKey:string):Promise<RuntimeExecutionRecord|null>{
    const client=prisma as unknown as {workflowExecutionRecord:{findUnique(args:unknown):Promise<RuntimeExecutionRecord|null>}};
    return client.workflowExecutionRecord.findUnique({where:{idempotencyKey}});
  }
  async save(record:RuntimeExecutionRecord):Promise<void>{
    const client=prisma as unknown as {workflowExecutionRecord:{upsert(args:unknown):Promise<unknown>}};
    await client.workflowExecutionRecord.upsert({where:{idempotencyKey:record.idempotencyKey},create:record,update:record});
  }
}
