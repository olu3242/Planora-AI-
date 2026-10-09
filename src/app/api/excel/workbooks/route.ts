import { ingestWorkbook } from "@/application/excel/workbook-service";
import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin, correlationId, seeOther } from "@/lib/request";
import { MAX_WORKBOOK_BYTES } from "@/integrations/spreadsheets/upload-security";

export async function POST(request: Request) {
  const cid = correlationId(request);
  try {
    assertSameOrigin(request);
    const session = await requireApiSession("financial.import");
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_WORKBOOK_BYTES + 64 * 1024) throw new AppError("VALIDATION_ERROR", "Workbook upload exceeds the request limit.", 413);
    const data = await request.formData(); const file = data.get("workbook");
    if (!(file instanceof File)) throw new AppError("VALIDATION_ERROR", "Select an XLSX workbook.", 400);
    const workbook = await ingestWorkbook(file, { organizationId: session.organization.id, actorId: session.user.id, correlationId: cid });
    return seeOther(`/excel/${workbook.id}`);
  } catch (error) {
    if (error instanceof AppError) return seeOther(`/excel?error=${encodeURIComponent(error.message)}`);
    return errorResponse(error, cid);
  }
}
