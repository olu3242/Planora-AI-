import { describe, expect, it } from "vitest";
import { hasPermission } from "@/permissions/permissions";
import { getOrganizationResource } from "@/repositories/organization-repository";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("authorization boundaries", () => {
  it("does not grant privileged approval or administration to an analyst", () => {
    expect(hasPermission("ANALYST", "mapping.approve")).toBe(false);
    expect(hasPermission("ANALYST", "reconciliation.certify")).toBe(false);
    expect(hasPermission("ANALYST", "forecast.publish")).toBe(false);
    expect(hasPermission("ANALYST", "admin.manage")).toBe(false);
  });

  it("fails a direct cross-tenant organization ID as not found", async () => {
    const organizations = await prisma.organization.findMany({ orderBy: { code: "asc" }, take: 2 });
    expect(organizations).toHaveLength(2);
    await expect(getOrganizationResource(organizations[0].id, organizations[1].id)).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", status: 404 });
  });
});
