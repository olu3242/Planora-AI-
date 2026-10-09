import { validateAndImportWorkbook } from "@/application/excel/workbook-service";
import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin, correlationId, seeOther } from "@/lib/request";
import { z } from "zod";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cid = correlationId(request);
  let workbookId = "";
  try {
    assertSameOrigin(request); const session = await requireApiSession("financial.import"); workbookId = z.uuid().parse((await params).id);
    await validateAndImportWorkbook({ organizationId: session.organization.id, actorId: session.user.id, correlationId: cid, workbookId });
    return seeOther(`/excel/${workbookId}?imported=1`);
  } catch (error) { if (error instanceof AppError) return seeOther(`/excel/${workbookId}?error=${encodeURIComponent(error.message)}`); return errorResponse(error, cid); }
}
