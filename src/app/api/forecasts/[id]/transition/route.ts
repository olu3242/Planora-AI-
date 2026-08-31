import { transitionForecast } from "@/application/forecast/forecast-service";
import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin, correlationId, seeOther } from "@/lib/request";
import { z } from "zod";
const schema = z.object({ action: z.enum(["submit", "review", "revise", "approve", "lock"]), reason: z.string().trim().min(3).max(500) });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const cid = correlationId(request); let id = ""; try { assertSameOrigin(request); const session = await requireApiSession("financial.read"); id = z.uuid().parse((await params).id); const body = schema.parse(Object.fromEntries(await request.formData())); await transitionForecast({ organizationId: session.organization.id, actorId: session.user.id, role: session.membership.role, correlationId: cid, versionId: id, ...body }); return seeOther(`/forecasts/${id}`); } catch (error) { if (error instanceof AppError) return seeOther(`/forecasts/${id}?error=${encodeURIComponent(error.message)}`); return errorResponse(error, cid); } }
