import { respondToRecommendation } from "@/agents/agent-service";
import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin, correlationId, seeOther } from "@/lib/request";
import { z } from "zod";

const schema = z.object({ decision: z.enum(["ACCEPTED", "EDITED", "REJECTED"]), finalContent: z.string().trim().max(2000).optional(), reason: z.string().trim().min(3).max(500), forecastVersionId: z.uuid() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cid = correlationId(request);
  const wantsJson = request.headers.get("content-type")?.includes("application/json") ?? false;
  let forecastVersionId = "";
  try {
    assertSameOrigin(request);
    const session = await requireApiSession("financial.read");
    const recommendationId = z.uuid().parse((await params).id);
    const raw = wantsJson ? await request.json() : Object.fromEntries(await request.formData());
    const body = schema.parse(raw);
    forecastVersionId = body.forecastVersionId;
    const result = await respondToRecommendation({ organizationId: session.organization.id, actorId: session.user.id, role: session.membership.role, correlationId: cid, recommendationId, decision: body.decision, finalContent: body.finalContent, reason: body.reason });
    if (wantsJson) return Response.json({ recommendation: result });
    return seeOther(`/forecasts/${forecastVersionId}?agentDecision=${result.status}#assistants`);
  } catch (error) {
    if (!wantsJson && error instanceof AppError && forecastVersionId) return seeOther(`/forecasts/${forecastVersionId}?error=${encodeURIComponent(error.message)}#assistants`);
    return errorResponse(error, cid);
  }
}
