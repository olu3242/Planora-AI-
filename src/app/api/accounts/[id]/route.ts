<<<<<<< HEAD
import { withTenantApi } from "@/lib/tenant-request";
=======
>>>>>>> origin/main
import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { correlationId } from "@/lib/request";
import { getTenantAccount } from "@/repositories/financial-repository";
import { z } from "zod";

<<<<<<< HEAD
async function handleGET(request: Request, { params }: { params: Promise<{ id: string }> }) {
=======
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
>>>>>>> origin/main
  const cid = correlationId(request);
  try { const session = await requireApiSession("financial.read"); const id = z.uuid().safeParse((await params).id); if (!id.success) throw new AppError("VALIDATION_ERROR", "Account identifier is invalid.", 400); return Response.json(await getTenantAccount(session.organization.id, id.data)); }
  catch (error) { return errorResponse(error, cid); }
}
<<<<<<< HEAD

export const GET = withTenantApi(handleGET);
=======
>>>>>>> origin/main
