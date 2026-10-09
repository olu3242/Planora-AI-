import "server-only";
import type { AgentKillSwitch, RoleCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAudit } from "@/audit/audit";
import { hashPassword } from "@/auth/password";
import { env } from "@/validation/env";

type AdminContext = { role: RoleCode; actorId: string; auditOrganizationId: string; correlationId: string };
function authorize(context: AdminContext) { if (context.role !== "PLATFORM_ADMIN") throw new AppError("FORBIDDEN", "Platform Admin authorization is required.", 403); }
const financialRoles = ["ANALYST", "FPA_DIRECTOR", "CFO"] as const;

export async function platformOverview(context: AdminContext) {
  authorize(context);
  const [organizations, memberships, agents, failedImports, failedRuntime, recoveries, audit] = await Promise.all([
    prisma.organization.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, code: true, name: true, active: true, pilot: true, createdAt: true, _count: { select: { memberships: { where: { active: true } }, forecasts: true } } } }),
    prisma.organizationMembership.findMany({ where: { role: { in: [...financialRoles] } }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, role: true, active: true, user: { select: { name: true, email: true } }, organization: { select: { id: true, code: true, name: true, pilot: true } } } }),
    prisma.agentDefinition.findMany({ orderBy: { displayName: "asc" }, select: { id: true, agentId: true, displayName: true, version: true, killSwitch: true } }),
    prisma.importBatch.count({ where: { status: { in: ["FAILED", "VALIDATION_FAILED"] } } }),
    prisma.runtimeExecution.count({ where: { status: "FAILED" } }),
    prisma.runtimeExecution.count({ where: { status: "RECOVERED" } }),
    prisma.auditEvent.findMany({ where: { OR: [{ action: { startsWith: "PLATFORM." } }, { action: { startsWith: "AUTHORIZATION." } }, { action: { in: ["IMPORT.VALIDATION_FAILED", "RUNTIME.EXECUTION_FAILED"] } }] }, orderBy: { occurredAt: "desc" }, take: 30, select: { id: true, action: true, entityType: true, entityId: true, correlationId: true, occurredAt: true, actor: { select: { name: true } }, organization: { select: { code: true } } } }),
  ]);
  return { organizations, memberships, agents, audit, health: { app: "READY", database: "CONNECTED", migration: "20260831203000_dashboard_admin_closure", failedImports, failedExports: 0, failedRuntime, recoveries, authorizationFailures: audit.filter((event) => event.action.startsWith("AUTHORIZATION.")).length, pilotReady: organizations.filter((org) => org.pilot && org.active && org._count.memberships >= 3 && org._count.forecasts > 0).length } };
}

export async function createPilotOrganization(context: AdminContext, input: { code: string; name: string }) {
  authorize(context);
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,30}$/.test(code)) throw new AppError("VALIDATION_ERROR", "Pilot code must use 3–30 letters, numbers, or hyphens.", 400);
  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { code, name: input.name.trim(), pilot: true, active: true } });
    await writeAudit(tx, { organizationId: context.auditOrganizationId, actorId: context.actorId, action: "PLATFORM.ORGANIZATION_CREATED", entityType: "Organization", entityId: organization.id, newState: { code, pilot: true, active: true }, correlationId: context.correlationId });
    return organization;
  });
}

export async function setPilotOrganizationActive(context: AdminContext, organizationId: string, active: boolean) {
  authorize(context);
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!organization || !organization.pilot) throw new AppError("FORBIDDEN", "Only an explicitly marked pilot organization can be changed.", 403);
  return prisma.$transaction(async (tx) => { const updated = await tx.organization.update({ where: { id: organization.id }, data: { active } }); await writeAudit(tx, { organizationId: context.auditOrganizationId, actorId: context.actorId, action: "PLATFORM.ORGANIZATION_STATE_CHANGED", entityType: "Organization", entityId: updated.id, previousState: { active: organization.active }, newState: { active }, correlationId: context.correlationId }); return updated; });
}

export async function upsertPilotMembership(context: AdminContext, input: { organizationId: string; email: string; name: string; role: RoleCode }) {
  authorize(context);
  if (!financialRoles.includes(input.role as typeof financialRoles[number])) throw new AppError("VALIDATION_ERROR", "Only Analyst, FP&A Director, or CFO pilot roles are allowed.", 400);
  const organization = await prisma.organization.findUnique({ where: { id: input.organizationId } });
  if (!organization?.pilot) throw new AppError("FORBIDDEN", "Membership administration is limited to pilot organizations.", 403);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({ where: { email: input.email.toLowerCase() }, update: { name: input.name, active: true }, create: { email: input.email.toLowerCase(), name: input.name, passwordHash: await hashPassword("Planora!2026") } });
    const previous = await tx.organizationMembership.findUnique({ where: { userId_organizationId: { userId: user.id, organizationId: organization.id } } });
    const membership = await tx.organizationMembership.upsert({ where: { userId_organizationId: { userId: user.id, organizationId: organization.id } }, update: { role: input.role, active: true }, create: { userId: user.id, organizationId: organization.id, role: input.role } });
    await writeAudit(tx, { organizationId: context.auditOrganizationId, actorId: context.actorId, action: previous ? "PLATFORM.MEMBERSHIP_CHANGED" : "PLATFORM.MEMBERSHIP_CREATED", entityType: "OrganizationMembership", entityId: membership.id, previousState: previous ? { role: previous.role, active: previous.active } : undefined, newState: { organizationId: organization.id, role: input.role, active: true }, correlationId: context.correlationId }); return membership;
  });
}

export async function deactivatePilotMembership(context: AdminContext, membershipId: string) {
  authorize(context);
  const membership = await prisma.organizationMembership.findUnique({ where: { id: membershipId }, include: { organization: true } });
  if (!membership?.organization.pilot || membership.role === "PLATFORM_ADMIN") throw new AppError("FORBIDDEN", "Only pilot financial memberships can be deactivated.", 403);
  return prisma.$transaction(async (tx) => { const updated = await tx.organizationMembership.update({ where: { id: membership.id }, data: { active: false } }); await tx.session.deleteMany({ where: { membershipId: membership.id } }); await writeAudit(tx, { organizationId: context.auditOrganizationId, actorId: context.actorId, action: "PLATFORM.MEMBERSHIP_DEACTIVATED", entityType: "OrganizationMembership", entityId: membership.id, previousState: { active: true }, newState: { active: false }, correlationId: context.correlationId }); return updated; });
}

export async function setAgentState(context: AdminContext, id: string, state: AgentKillSwitch) {
  authorize(context);
  const current = await prisma.agentDefinition.findUnique({ where: { id } }); if (!current) throw new AppError("RESOURCE_NOT_FOUND", "Agent definition was not found.", 404);
  return prisma.$transaction(async (tx) => { const updated = await tx.agentDefinition.update({ where: { id }, data: { killSwitch: state } }); await writeAudit(tx, { organizationId: context.auditOrganizationId, actorId: context.actorId, action: "PLATFORM.AGENT_STATE_CHANGED", entityType: "AgentDefinition", entityId: id, previousState: { killSwitch: current.killSwitch }, newState: { killSwitch: state, financialAuthorityChanged: false }, metadata: { agentId: current.agentId, version: current.version }, correlationId: context.correlationId }); return updated; });
}

export async function preparePilot(context: AdminContext, organizationId: string) {
  authorize(context); if (env().APP_ENV === "production") throw new AppError("FORBIDDEN", "Pilot preparation is disabled in production.", 403);
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } }); if (!organization?.pilot) throw new AppError("FORBIDDEN", "Only the selected pilot organization can be prepared.", 403);
  const effective = new Date("2026-01-01T00:00:00.000Z");
  return prisma.$transaction(async (tx) => {
    const calendar = await tx.fiscalCalendar.upsert({ where: { organizationId_code: { organizationId, code: "PILOT" } }, update: {}, create: { organizationId, code: "PILOT", name: "Pilot calendar" } });
    const year = await tx.fiscalYear.upsert({ where: { fiscalCalendarId_code: { fiscalCalendarId: calendar.id, code: "FY26" } }, update: {}, create: { fiscalCalendarId: calendar.id, code: "FY26", name: "Fiscal 2026", startDate: effective, endDate: new Date("2026-12-31T00:00:00.000Z") } });
    const period = await tx.fiscalPeriod.upsert({ where: { fiscalYearId_code: { fiscalYearId: year.id, code: "P01" } }, update: {}, create: { fiscalYearId: year.id, code: "P01", name: "January 2026", ordinal: 1, startDate: effective, endDate: new Date("2026-01-31T00:00:00.000Z") } });
    const center = await tx.costCenter.upsert({ where: { organizationId_code: { organizationId, code: "PILOT" } }, update: {}, create: { organizationId, code: "PILOT", name: "Pilot Operations", effectiveFrom: effective } });
    const specs = [["4000","Revenue","REVENUE","CREDIT","1000000","950000","1100000"],["5000","Cost of sales","COGS","DEBIT","300000","290000","320000"],["6000","Operating expense","OPERATING_EXPENSE","DEBIT","200000","210000","220000"]] as const;
    const forecast = await tx.forecast.upsert({ where: { organizationId_code: { organizationId, code: "PILOT-CURRENT" } }, update: { name: "Pilot Monthly Forecast" }, create: { organizationId, code: "PILOT-CURRENT", name: "Pilot Monthly Forecast" } });
    let version = await tx.forecastVersion.findUnique({ where: { forecastId_version: { forecastId: forecast.id, version: 1 } } });
    if (!version) version = await tx.forecastVersion.create({ data: { forecastId: forecast.id, version: 1 } });
    if (version.status !== "DRAFT") throw new AppError("CONFLICT", "Pilot reset will not overwrite a submitted, approved, or locked version.", 409);
    for (const [code,name,type,balance,actual,prior,current] of specs) { const account = await tx.account.upsert({ where: { organizationId_code: { organizationId, code } }, update: { name }, create: { organizationId, code, name, type, normalBalance: balance, effectiveFrom: effective } }); await tx.forecastLine.upsert({ where: { forecastVersionId_accountId_costCenterId_fiscalPeriodId: { forecastVersionId: version.id, accountId: account.id, costCenterId: center.id, fiscalPeriodId: period.id } }, update: { actualAmount: actual, priorForecast: prior, currentForecast: current }, create: { forecastVersionId: version.id, accountId: account.id, costCenterId: center.id, fiscalPeriodId: period.id, actualAmount: actual, priorForecast: prior, currentForecast: current } }); }
    await writeAudit(tx, { organizationId: context.auditOrganizationId, actorId: context.actorId, action: "PLATFORM.PILOT_PREPARED", entityType: "Organization", entityId: organizationId, newState: { forecastId: forecast.id, forecastVersionId: version.id, synthetic: true }, correlationId: context.correlationId }); return version;
  });
}
