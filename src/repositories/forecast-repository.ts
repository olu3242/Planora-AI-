import "server-only";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function getTenantForecastVersion(organizationId: string, id: string) {
<<<<<<< HEAD
  const version = await prisma.forecastVersion.findFirst({ where: { id, forecast: { organizationId } }, include: { forecast: true, lines: { include: { account: true, costCenter: true, fiscalPeriod: true, comments: { include: { author: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } } }, orderBy: [{ fiscalPeriod: { ordinal: "asc" } }, { account: { code: "asc" } }, { costCenter: { code: "asc" } }] }, comments: { where: { forecastLineId: null }, include: { author: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } } } });
=======
  const version = await prisma.forecastVersion.findFirst({ where: { id, forecast: { organizationId } }, include: { forecast: true, lines: { include: { account: true, costCenter: true, fiscalPeriod: true, comments: { include: { author: true }, orderBy: { createdAt: "desc" } } }, orderBy: [{ fiscalPeriod: { ordinal: "asc" } }, { account: { code: "asc" } }, { costCenter: { code: "asc" } }] }, comments: { where: { forecastLineId: null }, include: { author: true }, orderBy: { createdAt: "desc" } } } });
>>>>>>> origin/main
  if (!version) throw new AppError("RESOURCE_NOT_FOUND", "Forecast version was not found.", 404);
  return version;
}

export async function latestTenantForecastVersion(organizationId: string) {
  const version = await prisma.forecastVersion.findFirst({ where: { forecast: { organizationId, code: "FY26-MVP" } }, orderBy: { version: "desc" } });
  return version ? getTenantForecastVersion(organizationId, version.id) : null;
}
<<<<<<< HEAD

=======
>>>>>>> origin/main
