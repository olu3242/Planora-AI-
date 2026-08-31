import "server-only";
import { writeAudit } from "@/audit/audit";
import { correctionDraft } from "@/domain/financial/versions";
import { prisma } from "@/lib/prisma";

export async function createPlanCorrection(input: { organizationId: string; planVersionId: string; actorId: string; reason: string; correlationId: string }) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.planVersion.findFirstOrThrow({ where: { id: input.planVersionId, plan: { organizationId: input.organizationId } } });
    const data = correctionDraft(current.version, current.id, input.reason);
    const created = await tx.planVersion.create({ data: { planId: current.planId, ...data } });
    await writeAudit(tx, { organizationId: input.organizationId, actorId: input.actorId, action: "PLAN_VERSION.CORRECTION_CREATED", entityType: "PlanVersion", entityId: created.id, previousState: { id: current.id, version: current.version, status: current.status }, newState: { id: created.id, version: created.version, status: created.status }, metadata: { reason: data.reason }, correlationId: input.correlationId });
    return created;
  });
}
