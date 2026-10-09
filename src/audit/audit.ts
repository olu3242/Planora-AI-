import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";

type AuditClient = Prisma.TransactionClient | PrismaClient;

export type AuditInput = {
  organizationId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: Prisma.InputJsonValue;
  newState?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  correlationId: string;
};

export function normalizeAudit(input: AuditInput): AuditInput {
  return { ...input, action: input.action.trim().toUpperCase(), entityType: input.entityType.trim() };
}

export async function writeAudit(client: AuditClient, input: AuditInput) {
  return client.auditEvent.create({ data: normalizeAudit(input) });
}
