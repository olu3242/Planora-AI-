import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/auth/session";
import { withMappingTenant } from "@/lib/accounting/ai-mapping-tenant-transaction";
import { projectReadinessSnapshot } from "@/lib/accounting/financial-readiness-command-center";

export const dynamic = "force-dynamic";
/**
 * Returns an existing immutable assessment, not a synthetic readiness score.
 * Entity/period identifiers must be supplied explicitly and checked within the
 * session-derived tenant. The route never accepts client-provided control PASS.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireApiSession("financial.read");
    const legalEntityId = request.nextUrl.searchParams.get("legalEntityId")?.trim();
    const periodId = request.nextUrl.searchParams.get("periodId")?.trim();
    if (!legalEntityId || !periodId || !/^[0-9a-f-]{36}$/i.test(legalEntityId) || periodId.length > 128) {
      return NextResponse.json({ error: "INVALID_READINESS_SCOPE" }, { status: 400 });
    }
    const organizationId = session.organization.id;
    const row = await withMappingTenant(prisma, organizationId, async tx =>
      (tx as typeof prisma).financialReadinessAssessment.findFirst({
        where: { organizationId, legalEntityId, periodId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
    if (!row) return NextResponse.json({ status: "NOT_ASSESSED", assessment: null }, {
      status: 200, headers: { "Cache-Control": "no-store" },
    });
    const assessment = projectReadinessSnapshot(row, {
      organizationId, legalEntityId, periodId, asOf: row.asOf.toISOString(),
    });
    return NextResponse.json({ status: assessment.status, assessment }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
      ? error.status : 503;
    if (status === 401 || status === 403) return NextResponse.json({ error: status === 401 ? "AUTHENTICATION_REQUIRED" : "FORBIDDEN" }, { status });
    return NextResponse.json({ error: "READINESS_UNAVAILABLE" }, { status: 503 });
  }
}
