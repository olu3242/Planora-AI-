import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/auth/session";
import { withMappingTenant } from "@/lib/accounting/ai-mapping-tenant-transaction";
import { projectReadinessSnapshot, type StoredReadinessAssessment } from "@/lib/accounting/financial-readiness-read-model";

/** Latest persisted readiness snapshot. Does not evaluate or certify live sources. */
export async function GET(request: Request) {
  try {
    const session = await requireApiSession("financial.read");
    if (session.membership.role === "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    const params = new URL(request.url).searchParams;
    const legalEntityId = params.get("legalEntityId");
    const periodId = params.get("periodId");
    if (!legalEntityId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(legalEntityId) ||
      !periodId || periodId.length > 128 || !/^[A-Za-z0-9_.:-]+$/.test(periodId)) {
      return NextResponse.json({ error: "INVALID_READINESS_SCOPE" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const organizationId = session.organization.id;
    const row = await withMappingTenant(prisma, organizationId, async tx => {
      const db = tx as typeof prisma;
      return db.financialReadinessAssessment.findFirst({
        where: { organizationId, legalEntityId, periodId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });
    });
    if (!row) return NextResponse.json({ assessment: null, status: "NOT_ASSESSED" }, { headers: { "Cache-Control": "no-store" } });
    const assessment = projectReadinessSnapshot(row as StoredReadinessAssessment, organizationId);
    return NextResponse.json({ assessment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "AUTHENTICATION_REQUIRED" ? 401 : code.startsWith("FORBIDDEN") ? 403 : 503;
    return NextResponse.json({ error: status === 503 ? "READINESS_UNAVAILABLE" : status === 401 ? "AUTHENTICATION_REQUIRED" : "FORBIDDEN" }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
