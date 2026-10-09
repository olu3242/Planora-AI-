import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { correlationId } from "@/lib/request";
import { getOrganizationResource } from "@/repositories/organization-repository";
import { z } from "zod";

const idSchema = z.uuid();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cid = correlationId(request);
  try {
    const session = await requireApiSession("financial.read");
    const id = idSchema.safeParse((await params).id);
    if (!id.success) throw new AppError("VALIDATION_ERROR", "Resource identifier is invalid.", 400);
    return Response.json(await getOrganizationResource(session.organization.id, id.data));
  }
  catch (error) { return errorResponse(error, cid); }
}
