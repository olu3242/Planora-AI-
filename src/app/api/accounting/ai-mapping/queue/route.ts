import "server-only";
import { prisma } from "@/lib/prisma";
import { requireMappingPrincipal } from "@/lib/accounting/ai-mapping-session";
import { createMappingApplication } from "@/lib/accounting/ai-mapping-application";
import { PrismaAiMappingRepository, type MappingPrismaClient } from "@/lib/accounting/ai-mapping-prisma-repository";
import { NextResponse } from "next/server";

/**
 * Read-only queue. Session-derived tenant and role; never accepts tenant from query/body.
 * FORCE RLS denies access until a certified tenant-scoped database role/policy is installed.
 */
export async function GET() {
  try {
    const principal = await requireMappingPrincipal("read");
    const app = createMappingApplication({
      repository: new PrismaAiMappingRepository(prisma as unknown as MappingPrismaClient),
      loadProposal: async () => { throw new Error("MAPPING_REVIEW_ADAPTER_NOT_CERTIFIED"); },
      loadEligibleAccounts: async () => { throw new Error("MAPPING_ACCOUNT_ADAPTER_NOT_CERTIFIED"); },
      hasReview: async () => { throw new Error("MAPPING_REVIEW_ADAPTER_NOT_CERTIFIED"); },
    });
    const items = await app.queue(principal);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "AUTHENTICATION_REQUIRED") return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
    if (code.startsWith("FORBIDDEN_")) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: "MAPPING_QUEUE_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
