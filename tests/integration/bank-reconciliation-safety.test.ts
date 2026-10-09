import { randomUUID } from "node:crypto";
import { afterAll, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { previewReconciliation } from "@/application/accounting/reconciliation-service";

const db = new PrismaClient();
afterAll(() => db.$disconnect());

it("never treats a balanced journal total as bank movement without a cash-ledger mapping", async () => {
  const tenant = await db.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } });
  const foreign = await db.organization.findUniqueOrThrow({ where: { code: "HORIZON" } });
  const entity = await db.legalEntity.findFirstOrThrow({ where: { organizationId: tenant.id } });
  const bank = await db.bankAccount.create({ data: { organizationId: tenant.id, legalEntityId: entity.id, name: randomUUID(), currencyCode: "USD" } });
  await expect(previewReconciliation(tenant.id, bank.id)).rejects.toThrow("BANK_LEDGER_MAPPING_REQUIRED");
  await expect(previewReconciliation(foreign.id, bank.id)).rejects.toThrow("BANK_ACCOUNT_NOT_FOUND");
  await db.bankAccount.update({ where: { id: bank.id }, data: { active: false } });
  await expect(previewReconciliation(tenant.id, bank.id)).rejects.toThrow("BANK_ACCOUNT_NOT_FOUND");
});
