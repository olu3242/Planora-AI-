import "server-only";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/auth/session";
import { withMappingTenant } from "@/lib/accounting/ai-mapping-tenant-transaction";
import { prisma } from "@/lib/prisma";
import { verifyReadinessScopeInTransaction } from "@/lib/accounting/financial-readiness-scope-query";
import { cleanupRoleForSession } from "@/lib/accounting/bookkeeping-cleanup-auth";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Read-only, organization scoped cleanup work queue. */
export async function GET(request: Request) {
  try {
    const session = await requireApiSession("financial.read");
    cleanupRoleForSession(session.membership.role);
    const params = new URL(request.url).searchParams;
    const legalEntityId = params.get("legalEntityId") ?? "";
    const fiscalPeriodId = params.get("fiscalPeriodId") ?? "";
    if (!uuid.test(legalEntityId) || !uuid.test(fiscalPeriodId)) {
      return NextResponse.json({ error: "INVALID_CLEANUP_SCOPE" }, { status: 400 });
    }
    const organizationId = session.organization.id;
    const cases = await withMappingTenant(prisma, organizationId, async connection => {
      const tx = connection as typeof prisma;
      await verifyReadinessScopeInTransaction(tx, organizationId, legalEntityId, fiscalPeriodId);
      return tx.bookkeepingCleanupCase.findMany({
        where: { organizationId, legalEntityId, fiscalPeriodId },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 100,
      });
    });
    return NextResponse.json({ cases }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "AUTHENTICATION_REQUIRED" ? 401 :
      code.startsWith("FORBIDDEN") ? 403 : code === "READINESS_SCOPE_NOT_FOUND" ? 404 : 503;
    return NextResponse.json({ error: status === 503 ? "CLEANUP_UNAVAILABLE" : code }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
