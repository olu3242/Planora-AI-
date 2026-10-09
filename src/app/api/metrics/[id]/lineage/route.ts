import { explainMetricValue } from "@/application/financial/lineage-service";
import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { correlationId } from "@/lib/request";
import { z } from "zod";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cid = correlationId(request);
  try { const session = await requireApiSession("financial.read"); const id = z.uuid().safeParse((await params).id); if (!id.success) throw new AppError("VALIDATION_ERROR", "Metric identifier is invalid.", 400); const query = new URL(request.url).searchParams; const filter = z.object({ geographyId: z.uuid().optional(), productId: z.uuid().optional() }).parse({ geographyId: query.get("geography") ?? undefined, productId: query.get("product") ?? undefined }); return Response.json(await explainMetricValue(session.organization.id, id.data, filter)); }
  catch (error) { return errorResponse(error, cid); }
}
