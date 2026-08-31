import "server-only";
import { randomUUID } from "node:crypto";
import { AccountType, FinancialScenario, FinancialSourceType, ImportBatchStatus, MappingKind, MappingSuggestionStatus, MappingVersionStatus, Prisma, WorkbookStatus } from "@prisma/client";
import { writeAudit } from "@/audit/audit";
import { calculateMetrics } from "@/domain/financial/calculation-engine";
import { dimensionKey, financialFactGrain } from "@/domain/financial/lineage";
import { money } from "@/domain/financial/money";
import { parseXlsx } from "@/integrations/spreadsheets/exceljs-connector";
import { parseCsv } from "@/integrations/spreadsheets/csv-connector";
import { normalizeLabel, proposeColumnMappings, requiredConcepts, rowsAsRecords } from "@/integrations/spreadsheets/mapping-engine";
import { validateWorkbookComplexity, validateWorkbookUpload } from "@/integrations/spreadsheets/upload-security";
import { profileWorkbook } from "@/integrations/spreadsheets/workbook-profiler";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getTenantWorkbook } from "@/repositories/excel-repository";

type ActorContext = { organizationId: string; actorId: string; correlationId: string };
function parseFinancialFile(buffer: Buffer, fileName: string) { return fileName.toLowerCase().endsWith(".csv") ? Promise.resolve(parseCsv(buffer)) : parseXlsx(buffer); }

function accountMatch(source: string, accounts: Array<{ id: string; code: string; name: string; type: AccountType }>) {
  const normalized = normalizeLabel(source);
  const direct = accounts.find((account) => normalizeLabel(account.code) === normalized || normalizeLabel(account.name) === normalized);
  if (direct) return { account: direct, confidence: "1", reason: "Exact account code or name" };
  const type = normalized === "cogs" ? AccountType.COGS : normalized === "opex" ? AccountType.OPERATING_EXPENSE : undefined;
  const typed = type ? accounts.find((account) => account.type === type) : undefined;
  return typed ? { account: typed, confidence: "0.95", reason: "Governed financial alias" } : null;
}

export async function ingestWorkbook(file: File, context: ActorContext) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const secure = validateWorkbookUpload(file, buffer);
  const parsed = await parseFinancialFile(buffer, file.name);
  validateWorkbookComplexity(parsed);
  if (!parsed.sheets.length) throw new AppError("VALIDATION_ERROR", "Workbook contains no worksheets.", 400);
  const profile = profileWorkbook(parsed);
  const primary = parsed.sheets.find((sheet) => ["p&l", "forecast"].includes(sheet.name.trim().toLowerCase())) ?? parsed.sheets.find((sheet) => profile.sheets.find((candidate) => candidate.name === sheet.name)?.shape !== "UNKNOWN");
  const primaryProfile = primary && profile.sheets.find((sheet) => sheet.name === primary.name);
  if (!primary || !primaryProfile?.headerRow) throw new AppError("VALIDATION_ERROR", "Workbook has no importable P&L data block.", 400);
  const primaryHeaderRow = primaryProfile.headerRow;
  const columns = proposeColumnMappings(primary, primaryHeaderRow);
  const missing = requiredConcepts.filter((concept) => !columns.some((column) => column.targetConcept === concept));
  if (missing.length) throw new AppError("VALIDATION_ERROR", `Required columns are missing: ${missing.join(", ")}.`, 400);
  return prisma.$transaction(async (tx) => {
    let workbook = await tx.excelWorkbook.findUnique({ where: { organizationId_sha256: { organizationId: context.organizationId, sha256: secure.sha256 } } });
    if (workbook) return workbook;
    workbook = await tx.excelWorkbook.create({ data: { organizationId: context.organizationId, originalFileName: file.name, sanitizedFileName: secure.sanitizedFileName, mimeType: file.type || "application/octet-stream", byteSize: file.size, sha256: secure.sha256, content: buffer, status: WorkbookStatus.PROFILED } });
    await tx.workbookProfile.create({ data: { workbookId: workbook.id, fingerprint: profile.fingerprint, primaryShape: profile.primaryShape, sheetCount: profile.sheets.length, formulaCount: profile.formulaCount, hiddenSheetCount: profile.hiddenSheetCount, mergedCellCount: profile.mergedCellCount, profile: profile as unknown as Prisma.InputJsonValue } });
    const template = await tx.mappingTemplate.upsert({ where: { organizationId_fingerprint: { organizationId: context.organizationId, fingerprint: profile.fingerprint } }, update: { active: true }, create: { organizationId: context.organizationId, name: `${primary.name} ${profile.primaryShape} mapping`, fingerprint: profile.fingerprint } });
    const previous = await tx.mappingVersion.findFirst({ where: { templateId: template.id, status: MappingVersionStatus.APPROVED }, orderBy: { version: "desc" }, include: { suggestions: { include: { decision: true } } } });
    const latest = await tx.mappingVersion.aggregate({ where: { templateId: template.id }, _max: { version: true } });
    const mapping = await tx.mappingVersion.create({ data: { templateId: template.id, workbookId: workbook.id, version: (latest._max.version ?? 0) + 1, status: MappingVersionStatus.DRAFT, schemaFingerprint: profile.fingerprint } });
    await tx.mappingRule.createMany({ data: columns.map((column) => ({ mappingVersionId: mapping.id, kind: MappingKind.COLUMN, sourceField: column.sourceField, targetConcept: column.targetConcept, confidence: column.confidence, reason: column.reason })) });
    const accountColumn = columns.find((column) => column.targetConcept === "ACCOUNT")!.sourceField;
    const accountSources = [...new Set(rowsAsRecords(primary, primaryHeaderRow).map((row) => String(row.values[accountColumn] ?? "").trim()).filter(Boolean))];
    const accounts = await tx.account.findMany({ where: { organizationId: context.organizationId, active: true } });
    let reviewRequired = false;
    for (const sourceValue of accountSources) {
      const matched = accountMatch(sourceValue, accounts);
      const reusable = previous?.suggestions.find((suggestion) => normalizeLabel(suggestion.sourceValue) === normalizeLabel(sourceValue) && (suggestion.decision?.selectedTargetId || suggestion.suggestedTargetId));
      const targetId = matched?.account.id ?? reusable?.decision?.selectedTargetId ?? reusable?.suggestedTargetId ?? null;
      const status = targetId ? MappingSuggestionStatus.APPROVED : MappingSuggestionStatus.REVIEW_REQUIRED;
      if (!targetId) reviewRequired = true;
      await tx.mappingSuggestion.create({ data: { mappingVersionId: mapping.id, kind: MappingKind.MEMBER, sourceValue, targetConcept: "ACCOUNT", suggestedTargetId: targetId, confidence: matched?.confidence ?? (reusable ? "0.9" : "0"), reason: matched?.reason ?? (reusable ? "Reused approved template mapping" : "No canonical account matched"), status } });
    }
    await tx.mappingVersion.update({ where: { id: mapping.id }, data: { status: reviewRequired ? MappingVersionStatus.REVIEW_REQUIRED : MappingVersionStatus.APPROVED, approvedAt: reviewRequired ? null : new Date() } });
    await tx.excelWorkbook.update({ where: { id: workbook.id }, data: { status: reviewRequired ? WorkbookStatus.MAPPING_REVIEW : WorkbookStatus.PROFILED } });
    await writeAudit(tx, { organizationId: context.organizationId, actorId: context.actorId, action: "WORKBOOK.PROFILED", entityType: "ExcelWorkbook", entityId: workbook.id, newState: { status: reviewRequired ? "MAPPING_REVIEW" : "PROFILED", fingerprint: profile.fingerprint }, metadata: { fileName: secure.sanitizedFileName, byteSize: file.size, sheets: profile.sheets.length }, correlationId: context.correlationId });
    if (previous) await writeAudit(tx, { organizationId: context.organizationId, actorId: context.actorId, action: "MAPPING.REUSED", entityType: "MappingVersion", entityId: mapping.id, newState: { sourceMappingVersionId: previous.id, status: reviewRequired ? "REVIEW_REQUIRED" : "APPROVED" }, metadata: { workbookId: workbook.id, fingerprint: profile.fingerprint }, correlationId: context.correlationId });
    return workbook;
  });
}

export async function decideAccountMapping(input: ActorContext & { workbookId: string; suggestionId: string; accountId: string; reason: string }) {
  return prisma.$transaction(async (tx) => {
    const suggestion = await tx.mappingSuggestion.findFirst({ where: { id: input.suggestionId, mappingVersion: { workbookId: input.workbookId, template: { organizationId: input.organizationId } } }, include: { mappingVersion: true } });
    if (!suggestion || suggestion.targetConcept !== "ACCOUNT") throw new AppError("RESOURCE_NOT_FOUND", "Mapping suggestion was not found.", 404);
    const account = await tx.account.findFirst({ where: { id: input.accountId, organizationId: input.organizationId, active: true } });
    if (!account) throw new AppError("RESOURCE_NOT_FOUND", "Target account was not found.", 404);
    await tx.mappingDecision.upsert({ where: { suggestionId: suggestion.id }, update: { decidedById: input.actorId, decision: MappingSuggestionStatus.OVERRIDDEN, selectedTargetId: account.id, reason: input.reason }, create: { suggestionId: suggestion.id, decidedById: input.actorId, decision: MappingSuggestionStatus.OVERRIDDEN, selectedTargetId: account.id, reason: input.reason } });
    await tx.mappingSuggestion.update({ where: { id: suggestion.id }, data: { status: MappingSuggestionStatus.OVERRIDDEN } });
    const unresolved = await tx.mappingSuggestion.count({ where: { mappingVersionId: suggestion.mappingVersionId, status: MappingSuggestionStatus.REVIEW_REQUIRED } });
    if (unresolved === 0) await tx.mappingVersion.update({ where: { id: suggestion.mappingVersionId }, data: { status: MappingVersionStatus.APPROVED, approvedAt: new Date() } });
    await writeAudit(tx, { organizationId: input.organizationId, actorId: input.actorId, action: "MAPPING.ACCOUNT_OVERRIDDEN", entityType: "MappingSuggestion", entityId: suggestion.id, previousState: { sourceValue: suggestion.sourceValue, status: suggestion.status }, newState: { accountId: account.id, accountCode: account.code, status: "OVERRIDDEN" }, metadata: { reason: input.reason, mappingVersionId: suggestion.mappingVersionId }, correlationId: input.correlationId });
  });
}

export async function decideColumnMapping(input: ActorContext & { workbookId: string; ruleId: string; targetConcept: string; reason: string }) {
  if (!(requiredConcepts as readonly string[]).includes(input.targetConcept)) throw new AppError("VALIDATION_ERROR", "Target concept is not supported by the MVP import contract.", 400);
  return prisma.$transaction(async (tx) => {
    const rule = await tx.mappingRule.findFirst({ where: { id: input.ruleId, mappingVersion: { workbookId: input.workbookId, template: { organizationId: input.organizationId } } }, include: { mappingVersion: true } });
    if (!rule || rule.kind !== MappingKind.COLUMN) throw new AppError("RESOURCE_NOT_FOUND", "Column mapping rule was not found.", 404);
    const duplicate = await tx.mappingRule.findFirst({ where: { mappingVersionId: rule.mappingVersionId, id: { not: rule.id }, targetConcept: input.targetConcept } }); if (duplicate) throw new AppError("VALIDATION_ERROR", `${input.targetConcept} is already mapped to ${duplicate.sourceField}.`, 400);
    await tx.mappingRule.update({ where: { id: rule.id }, data: { targetConcept: input.targetConcept, confidence: "1", reason: input.reason } });
    await writeAudit(tx, { organizationId: input.organizationId, actorId: input.actorId, action: "MAPPING.COLUMN_UPDATED", entityType: "MappingRule", entityId: rule.id, previousState: { sourceField: rule.sourceField, targetConcept: rule.targetConcept }, newState: { sourceField: rule.sourceField, targetConcept: input.targetConcept }, metadata: { mappingVersionId: rule.mappingVersionId, workbookId: input.workbookId, reason: input.reason }, correlationId: input.correlationId });
  });
}

function conceptFields(rules: Array<{ sourceField: string; targetConcept: string }>) { return Object.fromEntries(rules.map((rule) => [rule.targetConcept, rule.sourceField])) as Record<string, string>; }

export async function validateAndImportWorkbook(input: ActorContext & { workbookId: string }) {
  const workspace = await getTenantWorkbook(input.organizationId, input.workbookId);
  const mapping = workspace.mappingVersions[0];
  if (!mapping || mapping.status !== MappingVersionStatus.APPROVED) throw new AppError("VALIDATION_ERROR", "All review-required mappings must be resolved before import.", 400);
  const parsed = await parseFinancialFile(Buffer.from(workspace.content), workspace.sanitizedFileName);
  const profileData = workspace.profile?.profile as unknown as { sheets: Array<{ name: string; headerRow: number | null }> };
  const sheet = parsed.sheets.find((item) => ["p&l", "forecast"].includes(item.name.trim().toLowerCase())) ?? parsed.sheets[0];
  const headerRow = profileData.sheets.find((item) => item.name === sheet.name)?.headerRow;
  if (!headerRow) throw new AppError("IMPORT_ERROR", "P&L header row is unavailable.", 422);
  const fields = conceptFields(mapping.rules);
  const sourceRows = rowsAsRecords(sheet, headerRow);
  const [accounts, periods, costCenters] = await Promise.all([
    prisma.account.findMany({ where: { organizationId: input.organizationId } }),
    prisma.fiscalPeriod.findMany({ where: { year: { calendar: { organizationId: input.organizationId } } } }),
    prisma.costCenter.findMany({ where: { organizationId: input.organizationId } }),
  ]);
  const accountTargets = new Map(mapping.suggestions.map((suggestion) => [normalizeLabel(suggestion.sourceValue), suggestion.decision?.selectedTargetId ?? suggestion.suggestedTargetId]));
  const lookup = <T extends { id: string; code: string; name?: string }>(items: T[], value: unknown) => items.find((item) => normalizeLabel(item.code) === normalizeLabel(String(value ?? "")) || (item.name && normalizeLabel(item.name) === normalizeLabel(String(value ?? ""))));
  const errors: Array<{ rowNumber: number; code: string; field: string; sourceValue: string; message: string; resolutionGuidance: string }> = [];
  const validated = sourceRows.map((row) => {
    const accountId = accountTargets.get(normalizeLabel(String(row.values[fields.ACCOUNT] ?? "")));
    const account = accounts.find((item) => item.id === accountId); const period = lookup(periods, row.values[fields.PERIOD]); const costCenter = lookup(costCenters, row.values[fields.COST_CENTER]);
    const parseAmount = (field: string) => { try { const value = money(String(row.values[field] ?? "")); return value.isFinite() ? value : null; } catch { return null; } };
    const actualAmount = parseAmount(fields.ACTUAL_AMOUNT); const forecastAmount = parseAmount(fields.FORECAST_AMOUNT);
    const checks = [[account, "UNMAPPED_ACCOUNT", "Account", fields.ACCOUNT, "Map this source account to an active canonical account."], [period, "INVALID_PERIOD", "Period", fields.PERIOD, "Use an open fiscal period code such as P01."], [costCenter, "MISSING_COST_CENTER", "Cost center", fields.COST_CENTER, "Provide a known cost center code or name."], [actualAmount, "INVALID_NUMERIC_VALUE", "Actual amount", fields.ACTUAL_AMOUNT, "Enter a decimal numeric value."], [forecastAmount, "INVALID_NUMERIC_VALUE", "Forecast amount", fields.FORECAST_AMOUNT, "Enter a decimal numeric value."]] as const;
    for (const [valid, code, label, field, guidance] of checks) if (!valid) errors.push({ rowNumber: row.rowNumber, code, field, sourceValue: String(row.values[field] ?? ""), message: `${label} is invalid or unmapped.`, resolutionGuidance: guidance });
    return { row, account, period, costCenter, actualAmount, forecastAmount };
  });
  const financialRows = new Map<string, number>();
  for (const item of validated) {
    if (!item.account || !item.period || !item.costCenter) continue;
    const key = `${item.account.id}:${item.costCenter.id}:${item.period.id}`;
    const firstRow = financialRows.get(key);
    if (firstRow) errors.push({ rowNumber: item.row.rowNumber, code: "DUPLICATE_FINANCIAL_ROW", field: "Account / Cost center / Period", sourceValue: key, message: `Financial grain duplicates row ${firstRow}.`, resolutionGuidance: "Keep one row for each account, cost center, and period combination." });
    else financialRows.set(key, item.row.rowNumber);
  }
  const existing = await prisma.importBatch.findUnique({ where: { workbookId_mappingVersionId: { workbookId: workspace.id, mappingVersionId: mapping.id } } });
  const batch = await prisma.importBatch.upsert({ where: { workbookId_mappingVersionId: { workbookId: workspace.id, mappingVersionId: mapping.id } }, update: { importedById: input.actorId, status: errors.length ? ImportBatchStatus.VALIDATION_FAILED : ImportBatchStatus.VALIDATING, rowCount: sourceRows.length, rejectedRowCount: errors.length, completedAt: null }, create: { organizationId: input.organizationId, workbookId: workspace.id, mappingVersionId: mapping.id, importedById: input.actorId, status: errors.length ? ImportBatchStatus.VALIDATION_FAILED : ImportBatchStatus.VALIDATING, rowCount: sourceRows.length, rejectedRowCount: errors.length } });
  await prisma.importError.deleteMany({ where: { importBatchId: batch.id } });
  if (errors.length) { await prisma.importError.createMany({ data: errors.map((error) => ({ importBatchId: batch.id, ...error, severity: "ERROR", blocking: true })) }); await writeAudit(prisma, { organizationId: input.organizationId, actorId: input.actorId, action: "IMPORT.VALIDATION_FAILED", entityType: "ImportBatch", entityId: batch.id, newState: { status: "VALIDATION_FAILED", issueCount: errors.length }, correlationId: input.correlationId }); throw new AppError("IMPORT_ERROR", `Import validation found ${errors.length} blocking issue(s).`, 422); }
  const totals = { REVENUE: money(0), COGS: money(0), OPERATING_EXPENSE: money(0) };
  await prisma.$transaction(async (tx) => {
    const forecast = await tx.forecast.upsert({ where: { organizationId_code: { organizationId: input.organizationId, code: "FY26-MVP" } }, update: { name: "FY26 Forecast Cycle" }, create: { organizationId: input.organizationId, code: "FY26-MVP", name: "FY26 Forecast Cycle" } });
    let version = await tx.forecastVersion.findFirst({ where: { forecastId: forecast.id, status: { in: ["DRAFT", "REVISION_REQUIRED"] } }, orderBy: { version: "desc" } });
    if (!version) { const latest = await tx.forecastVersion.aggregate({ where: { forecastId: forecast.id }, _max: { version: true } }); version = await tx.forecastVersion.create({ data: { forecastId: forecast.id, version: (latest._max.version ?? 0) + 1, status: "DRAFT" } }); }
    const sourceIdentifier = `FILE:${workspace.sha256}:${sheet.name}`;
    const prepared = validated.map((item) => {
      const account = item.account!; const dimensions = { costCenterId: item.costCenter!.id };
      if (account.type in totals) totals[account.type as keyof typeof totals] = totals[account.type as keyof typeof totals].plus(item.forecastAmount!);
      return { item, account, dimensions, facts: ([[FinancialScenario.ACTUAL, item.actualAmount!], [FinancialScenario.FORECAST, item.forecastAmount!]] as const).map(([scenario, amount]) => { const common = { ...dimensions, accountId: account.id, fiscalPeriodId: item.period!.id, scenario, currencyCode: "USD", sourceIdentifier, versionContext: batch.id }; return { common, scenario, amount: amount.toFixed(), grainKey: financialFactGrain(common) }; }) };
    });
    const factData = prepared.flatMap(({ facts, dimensions }) => facts.map((fact) => ({ id: randomUUID(), organizationId: input.organizationId, ...fact.common, amount: fact.amount, sourceType: FinancialSourceType.EXCEL_WORKBOOK, sourceMetadata: { workbookId: workspace.id, mappingVersionId: mapping.id, importBatchId: batch.id }, dimensionKey: dimensionKey(dimensions), grainKey: fact.grainKey })));
    await tx.financialFact.createMany({ data: factData, skipDuplicates: true });
    const persistedFacts = await tx.financialFact.findMany({ where: { organizationId: input.organizationId, grainKey: { in: factData.map((fact) => fact.grainKey) } }, select: { id: true, grainKey: true } }); const factIds = new Map(persistedFacts.map((fact) => [fact.grainKey, fact.id]));
    await tx.lineageReference.deleteMany({ where: { financialFactId: { in: persistedFacts.map((fact) => fact.id) } } });
    await tx.lineageReference.createMany({ data: prepared.flatMap(({ item, account, facts }) => facts.map((fact) => ({ financialFactId: factIds.get(fact.grainKey)!, sourceType: FinancialSourceType.EXCEL_WORKBOOK, sourceIdentifier, sourceLocation: { workbookId: workspace.id, fileName: workspace.sanitizedFileName, sheet: sheet.name, row: item.row.rowNumber, mappingVersionId: mapping.id, importBatchId: batch.id }, transformation: { operation: "approved forecast mapping", sourceAccount: item.row.values[fields.ACCOUNT], targetAccount: account.code, scenario: fact.scenario } }))) });
    for (let offset = 0; offset < prepared.length; offset += 500) {
      const values = prepared.slice(offset, offset + 500).map(({ item, account }) => Prisma.sql`(${randomUUID()}::uuid, ${version.id}::uuid, ${account.id}::uuid, ${item.costCenter!.id}::uuid, ${item.period!.id}::uuid, ${item.actualAmount!.toFixed()}::numeric, ${item.forecastAmount!.toFixed()}::numeric, ${item.forecastAmount!.toFixed()}::numeric, ${batch.id}::uuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
      await tx.$executeRaw(Prisma.sql`INSERT INTO "ForecastLine" ("id", "forecastVersionId", "accountId", "costCenterId", "fiscalPeriodId", "actualAmount", "priorForecast", "currentForecast", "sourceImportBatchId", "createdAt", "updatedAt") VALUES ${Prisma.join(values)} ON CONFLICT ("forecastVersionId", "accountId", "costCenterId", "fiscalPeriodId") DO UPDATE SET "actualAmount" = EXCLUDED."actualAmount", "priorForecast" = "ForecastLine"."currentForecast", "currentForecast" = EXCLUDED."currentForecast", "sourceImportBatchId" = EXCLUDED."sourceImportBatchId", "updatedAt" = CURRENT_TIMESTAMP`);
    }
    const metrics = calculateMetrics({ REVENUE: totals.REVENUE, COGS: totals.COGS, OPERATING_EXPENSE: totals.OPERATING_EXPENSE });
    const resultMetrics = Object.fromEntries([...metrics].map(([code, result]) => [code, result.value.toFixed()]));
    await tx.importBatch.update({ where: { id: batch.id }, data: { status: ImportBatchStatus.IMPORTED, completedAt: new Date(), sourceTotals: { revenue: totals.REVENUE.toFixed(), cogs: totals.COGS.toFixed(), operatingExpense: totals.OPERATING_EXPENSE.toFixed() }, resultMetrics } });
    await tx.excelWorkbook.update({ where: { id: workspace.id }, data: { status: WorkbookStatus.IMPORTED } });
    await writeAudit(tx, { organizationId: input.organizationId, actorId: input.actorId, action: "WORKBOOK.CANONICAL_IMPORT_COMPLETED", entityType: "ImportBatch", entityId: batch.id, previousState: existing ? { status: existing.status } : undefined, newState: { status: "IMPORTED", rowCount: sourceRows.length, EBITDA: resultMetrics.EBITDA }, metadata: { workbookId: workspace.id, mappingVersionId: mapping.id }, correlationId: input.correlationId });
  }, { timeout: 60_000 });
  return batch;
}
