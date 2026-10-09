import "server-only";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function getOrganizationResource(sessionOrganizationId: string, resourceId: string) {
  if (resourceId !== sessionOrganizationId) throw new AppError("RESOURCE_NOT_FOUND", "Resource not found.", 404);
  const resource = await prisma.organization.findUnique({ where: { id: resourceId }, select: { id: true, code: true, name: true } });
  if (!resource) throw new AppError("RESOURCE_NOT_FOUND", "Resource not found.", 404);
  return resource;
}
