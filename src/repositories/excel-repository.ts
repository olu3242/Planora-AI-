import "server-only";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function getTenantWorkbook(organizationId: string, id: string) {
  const workbook = await prisma.excelWorkbook.findFirst({
    where: { id, organizationId },
    include: {
      profile: true,
      mappingVersions: { orderBy: { version: "desc" }, take: 1, include: { rules: true, suggestions: { orderBy: [{ status: "asc" }, { sourceValue: "asc" }], include: { decision: true } } } },
      importBatches: { orderBy: { startedAt: "desc" }, take: 1, include: { errors: true } },
    },
  });
  if (!workbook) throw new AppError("RESOURCE_NOT_FOUND", "Workbook was not found.", 404);
  return workbook;
}

export async function listTenantWorkbooks(organizationId: string) {
  return prisma.excelWorkbook.findMany({ where: { organizationId }, select: { id: true, originalFileName: true, status: true, byteSize: true, uploadedAt: true, profile: { select: { primaryShape: true, sheetCount: true } } }, orderBy: { uploadedAt: "desc" }, take: 20 });
}
