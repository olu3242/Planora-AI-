import "server-only";
import type { Prisma } from "@prisma/client";
import { writeAudit } from "@/audit/audit";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { classifyFailure, mayRetry } from "./failure-classification";

type RuntimeContext = {
  correlationId: string;
  idempotencyKey: string;
  actorId: string;
  organizationId: string;
  forecastVersionId?: string;
  agentDefinitionId?: string;
  agentVersion?: number;
  command: string;
  targetId: string;
  retrySafe: boolean;
  maxAttempts?: number;
  request: Prisma.InputJsonValue;
};

export type RuntimeResult<T> = { value: T | null; duplicate: boolean; executionId: string; status: string };

export async function getTenantExecution(organizationId: string, executionId: string) {
  const execution = await prisma.runtimeExecution.findFirst({ where: { id: executionId, organizationId } });
  if (!execution) throw new AppError("RESOURCE_NOT_FOUND", "Runtime execution was not found.", 404);
  return execution;
}

export async function executeRuntimeCommand<T>(context: RuntimeContext, perform: () => Promise<T>, serialize: (value: T) => Prisma.InputJsonValue): Promise<RuntimeResult<T>> {
  const maxAttempts = Math.max(1, Math.min(context.maxAttempts ?? 1, 3));
  let execution;
  try {
    execution = await prisma.runtimeExecution.create({ data: {
      correlationId: context.correlationId,
      idempotencyKey: context.idempotencyKey,
      actorId: context.actorId,
      organizationId: context.organizationId,
      forecastVersionId: context.forecastVersionId,
      agentDefinitionId: context.agentDefinitionId,
      agentVersion: context.agentVersion,
      command: context.command,
      targetId: context.targetId,
      retrySafe: context.retrySafe,
      request: context.request,
    } });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
      const existing = await prisma.runtimeExecution.findUniqueOrThrow({ where: { organizationId_command_idempotencyKey: { organizationId: context.organizationId, command: context.command, idempotencyKey: context.idempotencyKey } } });
      await writeAudit(prisma, { organizationId: context.organizationId, actorId: context.actorId, action: "RUNTIME.DUPLICATE_PREVENTED", entityType: "RuntimeExecution", entityId: existing.id, previousState: { status: existing.status, attempt: existing.attempt }, newState: { status: existing.status, duplicatePrevented: true }, metadata: { command: context.command, targetId: context.targetId, idempotencyKey: context.idempotencyKey }, correlationId: context.correlationId });
      return { value: null, duplicate: true, executionId: existing.id, status: existing.status };
    }
    throw error;
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await prisma.runtimeExecution.update({ where: { id: execution.id }, data: { status: "RUNNING", attempt, errorCategory: null, errorCode: null } });
    try {
      const value = await perform();
      const status = attempt > 1 ? "RECOVERED" : "SUCCEEDED";
      await prisma.$transaction(async (tx) => {
        await tx.runtimeExecution.update({ where: { id: execution.id }, data: { status, result: serialize(value), completedAt: new Date() } });
        await writeAudit(tx, { organizationId: context.organizationId, actorId: context.actorId, action: attempt > 1 ? "RUNTIME.EXECUTION_RECOVERED" : "RUNTIME.EXECUTION_SUCCEEDED", entityType: "RuntimeExecution", entityId: execution.id, newState: { status, attempt }, metadata: { command: context.command, targetId: context.targetId, idempotencyKey: context.idempotencyKey }, correlationId: context.correlationId });
      });
      return { value, duplicate: false, executionId: execution.id, status };
    } catch (error) {
      lastError = error;
      const category = classifyFailure(error);
      const errorCode = error instanceof AppError ? error.code : typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : error instanceof Error ? error.name : "UNKNOWN";
      if (mayRetry(category, context.retrySafe, attempt, maxAttempts)) {
        await prisma.$transaction(async (tx) => {
          await tx.runtimeExecution.update({ where: { id: execution.id }, data: { status: "RETRY_PENDING", attempt, errorCategory: category, errorCode } });
          await writeAudit(tx, { organizationId: context.organizationId, actorId: context.actorId, action: "RUNTIME.RETRY_SCHEDULED", entityType: "RuntimeExecution", entityId: execution.id, previousState: { status: "RUNNING", attempt }, newState: { status: "RETRY_PENDING", attempt }, metadata: { command: context.command, targetId: context.targetId, errorCategory: category, boundedMaxAttempts: maxAttempts }, correlationId: context.correlationId });
        });
        continue;
      }
      await prisma.$transaction(async (tx) => {
        await tx.runtimeExecution.update({ where: { id: execution.id }, data: { status: "FAILED", attempt, errorCategory: category, errorCode, completedAt: new Date() } });
        await writeAudit(tx, { organizationId: context.organizationId, actorId: context.actorId, action: "RUNTIME.EXECUTION_FAILED", entityType: "RuntimeExecution", entityId: execution.id, newState: { status: "FAILED", attempt, errorCategory: category }, metadata: { command: context.command, targetId: context.targetId }, correlationId: context.correlationId });
      });
      throw error;
    }
  }
  throw lastError;
}
