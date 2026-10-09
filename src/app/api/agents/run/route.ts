import { runAgent } from "@/agents/agent-service";
import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin, correlationId, seeOther } from "@/lib/request";
import { z } from "zod";

const schema = z.object({
  agentId: z.enum(["PLANORA.WORKFLOW.ASSISTANT.NEXT_ACTION.v1", "PLANORA.FORECAST.ANALYST.VARIANCE.v1", "PLANORA.FORECAST.ANALYST.COMMENTARY.v1", "PLANORA.REVIEW.DIRECTOR.EXCEPTION.v1"]),
  forecastVersionId: z.uuid(),
  task: z.string().trim().min(3).max(100),
  prompt: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  const cid = correlationId(request);
  const wantsJson = request.headers.get("content-type")?.includes("application/json") ?? false;
  let forecastVersionId = "";
  try {
    assertSameOrigin(request);
    const session = await requireApiSession("financial.read");
    const raw = wantsJson ? await request.json() : Object.fromEntries(await request.formData());
    const body = schema.parse(raw);
    forecastVersionId = body.forecastVersionId;
    const result = await runAgent({ organizationId: session.organization.id, actorId: session.user.id, role: session.membership.role, correlationId: cid, ...body });
    if (wantsJson) return Response.json({ runId: result.runId, recommendation: result.recommendation });
    return seeOther(`/forecasts/${forecastVersionId}?agentRun=${result.runId}#assistants`);
  } catch (error) {
    if (!wantsJson && error instanceof AppError && forecastVersionId) return seeOther(`/forecasts/${forecastVersionId}?error=${encodeURIComponent(error.message)}#assistants`);
    return errorResponse(error, cid);
  }
}
