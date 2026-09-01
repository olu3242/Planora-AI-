import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createPilotOrganization, deactivatePilotMembership, preparePilot, setAgentState, setPilotOrganizationActive, upsertPilotMembership } from "@/application/platform-admin/platform-admin-service";

const prisma = new PrismaClient();
let actorId = "", auditOrganizationId = "", organizationId = "", membershipId = "", agentId = "";
const correlationId = `admin-${crypto.randomUUID()}`;
beforeAll(async () => { const admin = await prisma.user.findUniqueOrThrow({ where: { email: "platform-admin@planora.local" }, include: { memberships: true } }); actorId = admin.id; auditOrganizationId = admin.memberships[0].organizationId; agentId = (await prisma.agentDefinition.findFirstOrThrow()).id; });
afterAll(async () => { await prisma.agentDefinition.update({ where: { id: agentId }, data: { killSwitch: "ENABLED" } }); await prisma.$disconnect(); });
const context = () => ({ role: "PLATFORM_ADMIN" as const, actorId, auditOrganizationId, correlationId });

describe("bounded platform administration", () => {
  it("persists pilot organization, membership, role, state, preparation, and audit evidence", async () => {
    const organization = await createPilotOrganization(context(), { code: `PILOT-${crypto.randomUUID().slice(0,8)}`, name: "Admin Integration Pilot" }); organizationId = organization.id;
    const membership = await upsertPilotMembership(context(), { organizationId, email: `analyst-${crypto.randomUUID()}@example.test`, name: "Pilot Analyst", role: "ANALYST" }); membershipId = membership.id;
    await upsertPilotMembership(context(), { organizationId, email: (await prisma.user.findUniqueOrThrow({ where: { id: membership.userId } })).email, name: "Pilot Director", role: "FPA_DIRECTOR" });
    expect(await prisma.organizationMembership.findUnique({ where: { id: membershipId } })).toMatchObject({ role: "FPA_DIRECTOR", active: true });
    await preparePilot(context(), organizationId); expect(await prisma.forecast.findUnique({ where: { organizationId_code: { organizationId, code: "PILOT-CURRENT" } } })).not.toBeNull();
    await setPilotOrganizationActive(context(), organizationId, false); expect((await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } })).active).toBe(false); await setPilotOrganizationActive(context(), organizationId, true);
    await setAgentState(context(), agentId, "READ_ONLY"); expect((await prisma.agentDefinition.findUniqueOrThrow({ where: { id: agentId } })).killSwitch).toBe("READ_ONLY");
    await deactivatePilotMembership(context(), membershipId); expect((await prisma.organizationMembership.findUniqueOrThrow({ where: { id: membershipId } })).active).toBe(false);
    expect(await prisma.auditEvent.count({ where: { organizationId: auditOrganizationId, correlationId, action: { startsWith: "PLATFORM." } } })).toBeGreaterThanOrEqual(7);
  });

  it("fails closed for non-admins, non-pilot tenants, and production reset", async () => {
    await expect(setAgentState({ ...context(), role: "CFO" }, agentId, "DISABLED")).rejects.toMatchObject({ code: "FORBIDDEN" });
    const northstar = await prisma.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } });
    await expect(setPilotOrganizationActive(context(), northstar.id, false)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const previous = process.env.APP_ENV; process.env.APP_ENV = "production";
    try { await expect(preparePilot(context(), organizationId)).rejects.toMatchObject({ code: "FORBIDDEN" }); } finally { process.env.APP_ENV = previous; }
  });
});
