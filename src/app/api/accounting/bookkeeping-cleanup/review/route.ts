import { z } from "zod";
import { withTenantApi } from "@/lib/tenant-request";
import { requireApiSession } from "@/auth/session";
import { assertSameOrigin, correlationId } from "@/lib/request";
import { errorResponse } from "@/lib/errors";
import { getBookkeepingCleanupReviewState } from "@/application/accounting/bookkeeping-cleanup-review-state";
import { decideBookkeepingCleanupFinding } from "@/application/accounting/bookkeeping-cleanup-decisions";

const decisionSchema = z.object({
  executionId: z.uuid(),
  transactionId: z.string().trim().min(1).max(256),
  kind: z.enum(["DUPLICATE_CANDIDATE", "INVALID_INPUT"]),
  decision: z.enum(["ACCEPT_FINDING", "REJECT_FINDING"]),
  reason: z.string().trim().min(1).max(2000),
}).strict();
const querySchema = z.object({ executionId: z.uuid() });
async function handleGET(request: Request) {
  const cid = correlationId(request);
  try {
    const session = await requireApiSession("accounting.recommendation.review");
    const input = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const result = await getBookkeepingCleanupReviewState(
      { organizationId: session.organization.id, role: session.membership.role }, input.executionId,
    );
    return Response.json(result);
  } catch (error) { return errorResponse(error, cid); }
}
async function handlePOST(request: Request) {
  const cid = correlationId(request);
  try {
    assertSameOrigin(request);
    const session = await requireApiSession("accounting.recommendation.review");
    const input = decisionSchema.parse(await request.json());
    const result = await decideBookkeepingCleanupFinding(
      { organizationId: session.organization.id, actorId: session.user.id, role: session.membership.role, correlationId: cid }, input,
    );
    return Response.json(result, { status: 201 });
  } catch (error) { return errorResponse(error, cid); }
}
export const GET = withTenantApi(handleGET);
export const POST = withTenantApi(handlePOST);
