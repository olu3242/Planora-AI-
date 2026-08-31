import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { correlationId } from "@/lib/request";
import { getTenantAccount } from "@/repositories/financial-repository";
import { z } from "zod";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cid = correlationId(request);
  try { const session = await requireApiSession("financial.read"); const id = z.uuid().safeParse((await params).id); if (!id.success) throw new AppError("VALIDATION_ERROR", "Account identifier is invalid.", 400); return Response.json(await getTenantAccount(session.organization.id, id.data)); }
  catch (error) { return errorResponse(error, cid); }
}
