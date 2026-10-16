import "server-only";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/auth/session";
import { applyCleanupTransition } from "@/lib/accounting/bookkeeping-cleanup-repository";
import { cleanupRoleForSession, parseUserCleanupAction } from "@/lib/accounting/bookkeeping-cleanup-auth";
const casePattern = /^cleanup:[0-9a-f-]+:[0-9a-f-]+:[0-9a-f-]+:.{1,256}$/i;
/** Human review only: no direct accounting execution or verification endpoint. */
export async function POST(request: Request, context: { params: Promise<{ caseId: string }> }) {
  try {
    const session = await requireApiSession("financial.write");
    const actorRole = cleanupRoleForSession(session.membership.role);
    const { caseId: encodedId } = await context.params;
    const caseId = decodeURIComponent(encodedId);
    if (!casePattern.test(caseId)) return NextResponse.json({ error: "INVALID_CLEANUP_CASE" }, { status: 400 });
    const body = parseUserCleanupAction(await request.json());
    if (body.kind === "APPROVE" && session.membership.role !== "CFO") {
      return NextResponse.json({ error: "FORBIDDEN_CLEANUP_APPROVAL" }, { status: 403 });
    }
    const result = await applyCleanupTransition(session.organization.id, caseId, {
      ...body, actorId: session.user.id, actorRole,
    });
    return NextResponse.json({ case: result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "AUTHENTICATION_REQUIRED" ? 401 :
      code.startsWith("FORBIDDEN") || code === "CLEANUP_APPROVAL_DENIED" ? 403 :
      code === "CLEANUP_CASE_NOT_FOUND" || code === "READINESS_SCOPE_NOT_FOUND" ? 404 :
      code === "STALE_CLEANUP_REVISION" ? 409 :
      code.startsWith("INVALID_CLEANUP") || code === "CLEANUP_PROPOSAL_REQUIRED" ? 400 : 503;
    return NextResponse.json({ error: status === 503 ? "CLEANUP_UNAVAILABLE" : code }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
