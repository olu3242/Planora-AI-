import { withTenantApi } from "@/lib/tenant-request";
import { requireApiSession } from "@/auth/session";
import { listBookkeepingCleanupRuns } from "@/application/accounting/bookkeeping-cleanup-review";
import { correlationId } from "@/lib/request";
import { errorResponse } from "@/lib/errors";
import { parseCleanupPageLimit } from "@/domain/accounting/bookkeeping-cleanup-pagination";
async function handleGET(request: Request) {
  const cid = correlationId(request);
  try {
    const session = await requireApiSession("accounting.recommendation.review");
    const raw = new URL(request.url).searchParams.get("limit");
    const limit = raw === null ? 50 : Number(raw);
    const runs = await listBookkeepingCleanupRuns({ organizationId: session.organization.id, role: session.membership.role }, limit);
    return Response.json({ runs });
  } catch (error) { return errorResponse(error, cid); }
}
export const GET = withTenantApi(handleGET);
