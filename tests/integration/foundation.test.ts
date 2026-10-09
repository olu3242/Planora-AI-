import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { getOrganizationResource } from "@/repositories/organization-repository";
import { writeAudit } from "@/audit/audit";

const prisma = new PrismaClient();
let orgA = ""; let orgB = "";
beforeAll(async () => {
  const a = await prisma.organization.upsert({ where: { code: "TEST_A" }, update: {}, create: { code: "TEST_A", name: "Test A" } });
  const b = await prisma.organization.upsert({ where: { code: "TEST_B" }, update: {}, create: { code: "TEST_B", name: "Test B" } });
  orgA = a.id; orgB = b.id;
});
afterAll(() => prisma.$disconnect());

describe("foundation persistence", () => {
  it("allows tenant-owned resource", async () => expect((await getOrganizationResource(orgA, orgA)).id).toBe(orgA));
  it("denies a direct cross-tenant ID without disclosure", async () => expect(getOrganizationResource(orgA, orgB)).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", status: 404 }));
  it("writes audit and database prevents mutation", async () => {
    const event = await writeAudit(prisma, { organizationId: orgA, action: "TEST.EVENT", entityType: "Test", entityId: "1", correlationId: "test" });
    await expect(prisma.auditEvent.update({ where: { id: event.id }, data: { action: "TAMPERED" } })).rejects.toThrow();
  });
});
