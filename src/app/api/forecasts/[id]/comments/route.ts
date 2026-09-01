import { addForecastComment } from "@/application/forecast/forecast-service";
import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin, correlationId, seeOther } from "@/lib/request";
import { z } from "zod";
const schema = z.object({ lineId: z.union([z.literal(""), z.uuid()]).optional(), body: z.string().trim().min(3).max(2000) });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const cid = correlationId(request); let id = ""; try { assertSameOrigin(request); const session = await requireApiSession("financial.read"); id = z.uuid().parse((await params).id); const body = schema.parse(Object.fromEntries(await request.formData())); await addForecastComment({ organizationId: session.organization.id, actorId: session.user.id, role: session.membership.role, correlationId: cid, versionId: id, lineId: body.lineId || undefined, body: body.body }); return seeOther(`/forecasts/${id}`); } catch (error) { if (error instanceof AppError) return seeOther(`/forecasts/${id}?error=${encodeURIComponent(error.message)}`); return errorResponse(error, cid); } }
