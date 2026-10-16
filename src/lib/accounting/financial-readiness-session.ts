import "server-only";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/auth/session";
import { withMappingTenant } from "@/lib/accounting/ai-mapping-tenant-transaction";
import { projectReadinessSnapshot, type StoredReadinessAssessment } from "@/lib/accounting/financial-readiness-read-model";

/** Server-only projection. No live reassessment or privileged writes. */
export async function loadReadinessForSession(legalEntityId: string, periodId: string) {
  const session = await requireApiSession("financial.read");
  if (session.membership.role === "PLATFORM_ADMIN") throw new Error("FORBIDDEN_READINESS");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(legalEntityId) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(periodId)) throw new Error("INVALID_READINESS_SCOPE");
  const organizationId = session.organization.id;
  const row = await withMappingTenant(prisma, organizationId, async tx => {
    const db = tx as typeof prisma;
    return db.financialReadinessAssessment.findFirst({
      where: { organizationId, legalEntityId, periodId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  });
  return {
    role: session.membership.role,
    assessment: row ? projectReadinessSnapshot(row as StoredReadinessAssessment, organizationId) : null,
  };
}
