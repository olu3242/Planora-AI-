import "dotenv/config";
import { PrismaClient, RoleCode } from "@prisma/client";
import { hashPassword } from "../../src/auth/password";

const prisma = new PrismaClient();

async function seedOrganization(code: string, name: string) {
  return prisma.organization.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
}

async function seedUser(email: string, name: string, role: RoleCode, organizationId: string) {
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, active: true },
    create: { email, name, passwordHash: await hashPassword("Planora!2026") },
  });
  await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    update: { role, active: true },
    create: { userId: user.id, organizationId, role },
  });
}

async function main() {
  const northstar = await seedOrganization("NORTHSTAR", "Northstar Manufacturing");
  const horizon = await seedOrganization("HORIZON", "Horizon Services");
  await seedUser("cfo@planora.local", "Morgan Lee", RoleCode.CFO, northstar.id);
  await seedUser("director@planora.local", "Jordan Patel", RoleCode.FPA_DIRECTOR, northstar.id);
  await seedUser("analyst@planora.local", "Casey Rivera", RoleCode.ANALYST, northstar.id);
  await seedUser("cfo@horizon.local", "Avery Chen", RoleCode.CFO, horizon.id);
}

main().finally(() => prisma.$disconnect());
