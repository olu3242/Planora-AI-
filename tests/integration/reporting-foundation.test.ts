import { randomUUID } from "node:crypto";
import { afterAll, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createPrismaJournalPostingRepository } from "@/lib/accounting/prisma-posting-adapter";
import { approveReportingRun, prepareReportingRun, publishReportingRun, recordDisclosureEvidence, recordReportingCloseEvidence, reviewReportingRun } from "@/application/accounting/reporting-governance-service";

const db = new PrismaClient();
afterAll(() => db.$disconnect());

it("maps the canonical ledger, reconciles sourced evidence, and publishes only after independent human review and approval", async () => {
  const org = await db.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } });
  const analyst = await db.user.findUniqueOrThrow({ where: { email: "analyst@planora.local" } });
  const director = await db.user.findUniqueOrThrow({ where: { email: "director@planora.local" } });
  const cfo = await db.user.findUniqueOrThrow({ where: { email: "cfo@planora.local" } });
  const entity = await db.legalEntity.findFirstOrThrow({ where: { organizationId: org.id } });
  const period = await db.fiscalPeriod.findFirstOrThrow({ where: { year: { calendar: { organizationId: org.id } } } });
  const common = { organizationId: org.id, effectiveFrom: period.startDate, statementClass: "BALANCE_SHEET" as const };
  const cash = await db.account.create({ data: { ...common, code: `cash-${randomUUID()}`, name: "Cash", type: "ASSET", normalBalance: "DEBIT", reportingCode: "CASH", cashFlowClass: "CASH" } });
  const equity = await db.account.create({ data: { ...common, code: `capital-${randomUUID()}`, name: "Capital", type: "EQUITY", normalBalance: "CREDIT", reportingCode: "CAPITAL", cashFlowClass: "FINANCING" } });
  const sourceKey = `reporting-${randomUUID()}`;
  await db.accountingPostingApproval.create({ data: { organizationId: org.id, legalEntityId: entity.id, fiscalPeriodId: period.id,
    sourceKey, preparedById: cfo.id, decidedById: director.id, decision: "APPROVED", evidence: { reference: "capital-contribution" },
    decidedAt: new Date(), expiresAt: new Date(Date.now() + 60000) } });
  await createPrismaJournalPostingRepository(db, cfo.id, org.id).postAtomically({ organizationId: org.id, actorId: cfo.id,
    legalEntityId: entity.id, fiscalPeriodId: period.id, sourceKey, currencyCode: "USD",
    lines: [{ accountId: cash.id, debitMinor: 10000n, creditMinor: 0n }, { accountId: equity.id, debitMinor: 0n, creditMinor: 10000n }] });
  const version = randomUUID();
  const framework = await db.reportingFrameworkVersion.create({ data: { organizationId: org.id, frameworkCode: "US_GAAP", version,
    effectiveFrom: period.startDate, ruleManifest: {
      policy: { sector: "PRIVATE", framework: "US_GAAP", jurisdiction: "US", version, effectiveFrom: "2026-01-01" },
      mappings: { [cash.id]: { statement: "balance_sheet", section: "assets" }, [equity.id]: { statement: "balance_sheet", section: "equity" } },
    }, disclosureManifest: [{ code: "CAPITAL", required: true }] } });
  const run = await prepareReportingRun({ organizationId: org.id, legalEntityId: entity.id, fiscalPeriodId: period.id, frameworkVersionId: framework.id, actor: analyst });
  await recordDisclosureEvidence({ organizationId: org.id, runId: run.id, requirementCode: "CAPITAL", actor: analyst, evidence: { reference: "capital-contribution" } });
  // Disclosure alone is insufficient: every mapped section and account needs sourced evidence.
  await expect(reviewReportingRun({ organizationId: org.id, runId: run.id, actor: director, reason: "review" })).rejects.toThrow();
  await recordReportingCloseEvidence({ organizationId: org.id, runId: run.id, actor: analyst, evidence: {
    expected: [{ statement: "balance_sheet", section: "assets", amountMinor: "10000", reference: "bank-statement" },
      { statement: "balance_sheet", section: "equity", amountMinor: "-10000", reference: "capital-register" }],
    reconciliations: [{ accountId: cash.id, externalBalanceMinor: "10000", reference: "bank-statement" },
      { accountId: equity.id, externalBalanceMinor: "-10000", reference: "capital-register" }],
  } });
  await reviewReportingRun({ organizationId: org.id, runId: run.id, actor: director, reason: "Amounts and source references reviewed" });
  await expect(recordDisclosureEvidence({ organizationId: org.id, runId: run.id, requirementCode: "CAPITAL", actor: analyst, evidence: { reference: "replacement" } })).rejects.toThrow("REPORTING_RUN_NOT_EDITABLE");
  await approveReportingRun({ organizationId: org.id, runId: run.id, actor: cfo, reason: "Approved reviewed draft" });
  const published = await publishReportingRun({ organizationId: org.id, runId: run.id, actor: cfo });
  expect(published.status).toBe("PUBLISHED");
  await expect(db.reportingRun.delete({ where: { id: run.id } })).rejects.toThrow(/immutable/i);
  await expect(db.reportingDisclosureEvidence.create({ data: { runId: run.id, requirementCode: "LATE", evidence: {} } })).rejects.toThrow(/immutable/i);
  expect(await db.auditEvent.count({ where: { entityId: run.id, entityType: "ReportingRun" } })).toBe(6);
});
