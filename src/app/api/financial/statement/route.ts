import { getActualStatement } from "@/application/financial/statement-service";
import { requireApiSession } from "@/auth/session";
import { errorResponse } from "@/lib/errors";
import { correlationId } from "@/lib/request";
import { z } from "zod";

const querySchema = z.object({ period: z.uuid().optional(), geography: z.uuid().optional(), product: z.uuid().optional() });
export async function GET(request: Request) {
  const cid = correlationId(request);
  try {
    const session = await requireApiSession("financial.read"); const url = new URL(request.url);
    const query = querySchema.parse({ period: url.searchParams.get("period") || undefined, geography: url.searchParams.get("geography") || undefined, product: url.searchParams.get("product") || undefined });
    return Response.json(await getActualStatement(session.organization.id, { periodId: query.period, geographyId: query.geography, productId: query.product }));
  } catch (error) { return errorResponse(error, cid); }
}
