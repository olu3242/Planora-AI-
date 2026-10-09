import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createPrismaJournalPostingRepository } from "@/lib/accounting/prisma-posting-adapter";

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

async function fixture() {
  const organization = await prisma.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } });
  const otherOrganization = await prisma.organization.findUniqueOrThrow({ where: { code: "HORIZON" } });
  const preparer = await prisma.user.findUniqueOrThrow({ where: { email: "analyst@planora.local" } });
  const reviewer = await prisma.user.findUniqueOrThrow({ where: { email: "director@planora.local" } });
  const poster = await prisma.user.findUniqueOrThrow({ where: { email: "cfo@planora.local" } });
  const entity = await prisma.legalEntity.findFirstOrThrow({ where: { organizationId: organization.id } });
  const otherEntity = await prisma.legalEntity.findFirstOrThrow({ where: { organizationId: otherOrganization.id } });
  const period = await prisma.fiscalPeriod.findFirstOrThrow({
    where: { year: { calendar: { organizationId: organization.id } } },
  });
  const otherPeriod = await prisma.fiscalPeriod.findFirstOrThrow({
    where: { year: { calendar: { organizationId: otherOrganization.id } } },
  });
  const debitAccount = await prisma.account.findFirstOrThrow({
    where: { organizationId: organization.id, code: "6000" },
  });
  const creditAccount = await prisma.account.findFirstOrThrow({
    where: { organizationId: organization.id, code: "4000" },
  });
  return {
    organization, otherOrganization, preparer, reviewer, poster, entity, otherEntity,
    period, otherPeriod, debitAccount, creditAccount,
  };
}

async function createApproval(
  context: Awaited<ReturnType<typeof fixture>>,
  overrides: Partial<{
    organizationId: string;
    legalEntityId: string;
    fiscalPeriodId: string;
    sourceKey: string;
    preparedById: string;
    decidedById: string | null;
    decision: "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";
    evidence: object;
    expiresAt: Date | null;
    decidedAt: Date | null;
  }> = {},
) {
  return prisma.accountingPostingApproval.create({
    data: {
      organizationId: context.organization.id,
      legalEntityId: context.entity.id,
      fiscalPeriodId: context.period.id,
      sourceKey: `accounting-cert-${randomUUID()}`,
      preparedById: context.preparer.id,
      decidedById: context.reviewer.id,
      decision: "APPROVED",
      evidence: { fixture: "accounting-database-certification" },
      expiresAt: new Date(Date.now() + 60_000),
      decidedAt: new Date(),
      ...overrides,
    },
  });
}

function postingRepository(context: Awaited<ReturnType<typeof fixture>>) {
  return createPrismaJournalPostingRepository(prisma, context.poster.id, context.organization.id);
}

function postingLines(context: Awaited<ReturnType<typeof fixture>>) {
  return [
    { accountId: context.debitAccount.id, debitMinor: 100n, creditMinor: 0n },
    { accountId: context.creditAccount.id, debitMinor: 0n, creditMinor: 100n },
  ];
}

describe("accounting database certification", () => {
  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  it("records successful approval and immutability migrations with required database guards", async () => {
    const migrations = await prisma.$queryRaw<Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>>`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      WHERE migration_name IN (
        '20261009040000_accounting_posting_approvals',
        '20261009041000_accounting_immutability',
        '20261009042000_accounting_approval_scope'
      )
    `;
    expect(migrations).toHaveLength(3);
    expect(migrations.every((migration) => migration.finished_at && !migration.rolled_back_at)).toBe(true);

    const constraintNames = await prisma.$queryRaw<Array<{ conname: string }>>`
      SELECT conname FROM pg_constraint
      WHERE conname IN (
        'AccountingApprovalSeparation',
        'AccountingApprovalDecisionEvidence',
        'AccountingApprovalConsumption',
        'AccountingPostingApproval_legalEntityId_fkey',
        'AccountingPostingApproval_fiscalPeriodId_fkey'
      )
    `;
    expect(constraintNames.map((constraint) => constraint.conname)).toEqual(expect.arrayContaining([
      "AccountingApprovalSeparation",
      "AccountingApprovalDecisionEvidence",
      "AccountingApprovalConsumption",
      "AccountingPostingApproval_legalEntityId_fkey",
      "AccountingPostingApproval_fiscalPeriodId_fkey",
    ]));

    const triggerNames = await prisma.$queryRaw<Array<{ tgname: string }>>`
      SELECT tgname FROM pg_trigger
      WHERE NOT tgisinternal AND tgname IN (
        'planora_posted_journal_immutable',
        'planora_posted_journal_line_immutable',
        'planora_audit_event_immutable',
        'accounting_posting_approval_scope_guard',
        'accounting_posting_approval_immutable'
      )
    `;
    expect(triggerNames.map((trigger) => trigger.tgname)).toEqual(expect.arrayContaining([
      "planora_posted_journal_immutable",
      "planora_posted_journal_line_immutable",
      "planora_audit_event_immutable",
      "accounting_posting_approval_scope_guard",
      "accounting_posting_approval_immutable",
    ]));
  });

  it("rejects self-approval and approval records scoped to another tenant", async () => {
    const context = await fixture();
    await expect(createApproval(context, { decidedById: context.preparer.id }))
      .rejects.toThrow(/AccountingApprovalSeparation/);
    await expect(createApproval(context, { legalEntityId: context.otherEntity.id }))
      .rejects.toThrow("ACCOUNTING_APPROVAL_ENTITY_SCOPE_MISMATCH");
    await expect(createApproval(context, { fiscalPeriodId: context.otherPeriod.id }))
      .rejects.toThrow("ACCOUNTING_APPROVAL_PERIOD_SCOPE_MISMATCH");
  });

  it("preserves approval scope, evidence, and decided expiry", async () => {
    const context = await fixture();
    const approval = await createApproval(context);
    await expect(prisma.accountingPostingApproval.update({
      where: { id: approval.id }, data: { evidence: { rewritten: true } },
    })).rejects.toThrow("ACCOUNTING_APPROVAL_PROVENANCE_IMMUTABLE");
    await expect(prisma.accountingPostingApproval.update({
      where: { id: approval.id }, data: { expiresAt: new Date(Date.now() + 3_600_000) },
    })).rejects.toThrow("ACCOUNTING_APPROVAL_DECISION_IMMUTABLE");
  });

  it("rejects an expired approval both through posting and at database consumption", async () => {
    const context = await fixture();
    const approval = await createApproval(context, { expiresAt: new Date(Date.now() - 60_000) });
    const draft = await prisma.accountingJournal.create({
      data: {
        organizationId: context.organization.id,
        legalEntityId: context.entity.id,
        fiscalPeriodId: context.period.id,
        sourceKey: `accounting-expired-draft-${randomUUID()}`,
        currencyCode: "USD",
      },
    });

    await expect(postingRepository(context).postAtomically({
      organizationId: context.organization.id,
      legalEntityId: context.entity.id,
      fiscalPeriodId: context.period.id,
      sourceKey: approval.sourceKey,
      currencyCode: "USD",
      lines: postingLines(context),
      actorId: context.poster.id,
    })).rejects.toThrow("APPROVAL_EXPIRED");
    await expect(prisma.accountingPostingApproval.update({
      where: { id: approval.id },
      data: { consumedAt: new Date(), journalId: draft.id },
    })).rejects.toThrow("ACCOUNTING_APPROVAL_NOT_CONSUMABLE");
    expect(await prisma.accountingJournal.count({ where: { sourceKey: approval.sourceKey } })).toBe(0);
  });

  it("consumes an approval atomically and rejects changes to posted journals, lines, audit and approval evidence", async () => {
    const context = await fixture();
    const approval = await createApproval(context);
    const posted = await postingRepository(context).postAtomically({
      organizationId: context.organization.id,
      legalEntityId: context.entity.id,
      fiscalPeriodId: context.period.id,
      sourceKey: approval.sourceKey,
      currencyCode: "USD",
      lines: postingLines(context),
      actorId: context.poster.id,
    });
    const consumedApproval = await prisma.accountingPostingApproval.findUniqueOrThrow({ where: { id: approval.id } });
    const journal = await prisma.accountingJournal.findUniqueOrThrow({
      where: { id: posted.journalId },
      include: { lines: true },
    });
    const auditEvent = await prisma.auditEvent.findFirstOrThrow({
      where: { entityType: "AccountingJournal", entityId: posted.journalId },
    });

    expect(posted.created).toBe(true);
    expect(consumedApproval.consumedAt).toBeInstanceOf(Date);
    expect(consumedApproval.journalId).toBe(journal.id);
    expect(journal.status).toBe("POSTED");
    await expect(prisma.accountingJournal.update({
      where: { id: journal.id }, data: { description: "tampered" },
    })).rejects.toThrow("POSTED_JOURNAL_IMMUTABLE");
    await expect(prisma.accountingJournal.delete({ where: { id: journal.id } }))
      .rejects.toThrow("POSTED_JOURNAL_IMMUTABLE");
    await expect(prisma.accountingJournalLine.update({
      where: { id: journal.lines[0].id }, data: { debitMinor: 101n },
    })).rejects.toThrow("POSTED_JOURNAL_LINE_IMMUTABLE");
    await expect(prisma.accountingJournalLine.delete({ where: { id: journal.lines[0].id } }))
      .rejects.toThrow("POSTED_JOURNAL_LINE_IMMUTABLE");
    await expect(prisma.auditEvent.update({
      where: { id: auditEvent.id }, data: { action: "TAMPERED" },
    })).rejects.toThrow(/immutable|append-only/i);
    await expect(prisma.auditEvent.delete({ where: { id: auditEvent.id } }))
      .rejects.toThrow(/immutable|append-only/i);
    await expect(prisma.accountingPostingApproval.update({
      where: { id: approval.id }, data: { evidence: { tampered: true } },
    })).rejects.toThrow("ACCOUNTING_APPROVAL_CONSUMED_IMMUTABLE");
    await expect(prisma.accountingPostingApproval.delete({ where: { id: approval.id } }))
      .rejects.toThrow("ACCOUNTING_APPROVAL_IMMUTABLE");
  });

  it("refuses to post an unbalanced draft at the database boundary", async () => {
    const context = await fixture();
    const journal = await prisma.accountingJournal.create({
      data: {
        organizationId: context.organization.id,
        legalEntityId: context.entity.id,
        fiscalPeriodId: context.period.id,
        sourceKey: `accounting-unbalanced-${randomUUID()}`,
        postedById: context.poster.id,
        currencyCode: "USD",
        lines: {
          create: [
            { ordinal: 0, accountId: context.debitAccount.id, debitMinor: 100n, creditMinor: 0n },
            { ordinal: 1, accountId: context.creditAccount.id, debitMinor: 0n, creditMinor: 99n },
          ],
        },
      },
    });
    await expect(prisma.accountingJournal.update({
      where: { id: journal.id },
      data: { status: "POSTED", postedAt: new Date() },
    })).rejects.toThrow("UNBALANCED_JOURNAL");
    expect(await prisma.accountingJournal.findUniqueOrThrow({ where: { id: journal.id } }))
      .toMatchObject({ status: "DRAFT", postedAt: null });
  });
});