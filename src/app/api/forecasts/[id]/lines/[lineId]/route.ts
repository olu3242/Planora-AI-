import { updateForecastLine } from "@/application/forecast/forecast-service";
import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin, correlationId, seeOther } from "@/lib/request";
import { z } from "zod";
const schema = z.object({ currentForecast: z.string().regex(/^-?\d+(\.\d{1,6})?$/), reason: z.string().trim().min(3).max(240) });
export async function POST(request: Request, { params }: { params: Promise<{ id: string; lineId: string }> }) { const cid = correlationId(request); let id = ""; try { assertSameOrigin(request); const session = await requireApiSession("financial.write"); const p = await params; id = z.uuid().parse(p.id); const body = schema.parse(Object.fromEntries(await request.formData())); await updateForecastLine({ organizationId: session.organization.id, actorId: session.user.id, role: session.membership.role, correlationId: cid, versionId: id, lineId: z.uuid().parse(p.lineId), ...body }); return seeOther(`/forecasts/${id}`); } catch (error) { if (error instanceof AppError) return seeOther(`/forecasts/${id}?error=${encodeURIComponent(error.message)}`); return errorResponse(error, cid); } }
