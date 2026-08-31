import { decideAccountMapping, decideColumnMapping } from "@/application/excel/workbook-service";
import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin, correlationId, seeOther } from "@/lib/request";
import { z } from "zod";

const schema = z.union([z.object({ suggestionId: z.uuid(), accountId: z.uuid(), reason: z.string().trim().min(3).max(240) }), z.object({ ruleId: z.uuid(), targetConcept: z.enum(["ACCOUNT", "PERIOD", "COST_CENTER", "ACTUAL_AMOUNT", "FORECAST_AMOUNT"]), reason: z.string().trim().min(3).max(240) })]);
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cid = correlationId(request); let workbookId = "";
  try {
    assertSameOrigin(request); const session = await requireApiSession("mapping.review");
    workbookId = z.uuid().parse((await params).id); const body = schema.parse(Object.fromEntries(await request.formData()));
    if ("ruleId" in body) await decideColumnMapping({ organizationId: session.organization.id, actorId: session.user.id, correlationId: cid, workbookId, ...body }); else await decideAccountMapping({ organizationId: session.organization.id, actorId: session.user.id, correlationId: cid, workbookId, ...body });
    return seeOther(`/excel/${workbookId}`);
  } catch (error) { if (error instanceof AppError) return seeOther(`${workbookId ? `/excel/${workbookId}` : "/excel"}?error=${encodeURIComponent(error.message)}`); return errorResponse(error, cid); }
}
