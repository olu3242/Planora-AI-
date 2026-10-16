import "server-only";
import { prisma } from "@/lib/prisma";
import { requireMappingPrincipal } from "@/lib/accounting/ai-mapping-session";
import { withMappingTenant } from "@/lib/accounting/ai-mapping-tenant-transaction";
import { NextResponse } from "next/server";

/** Read-only tenant queue. All SQL runs inside one transaction-local RLS context. */
export async function GET() {
  try {
    const principal = await requireMappingPrincipal("read");
    const allowedRoles = principal.roles.filter(r => r !== "PLATFORM_ADMIN");
    const items = await withMappingTenant(prisma, principal.organizationId, async tx => {
      // The tenant-scoped query executes on the same transaction connection
      // after set_config, so pooled connections cannot leak tenant context.
      const db = tx as typeof prisma;
      return db.aiTransactionMappingWorkItem.findMany({
        where: { organizationId: principal.organizationId, assignedRole: { in: allowedRoles } },
        select: {
          id: true, assignedRole: true, state: true, priority: true, reason: true,
          proposal: { select: { idempotencyKey: true, transactionId: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      });
    });
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "AUTHENTICATION_REQUIRED") return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
    if (code.startsWith("FORBIDDEN_")) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: "MAPPING_QUEUE_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
