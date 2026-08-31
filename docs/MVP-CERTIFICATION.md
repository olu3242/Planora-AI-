# Planora Forecast MVP Certification

Scope: the canonical forecast cycle only. Status is based on executable repository evidence, not route or file existence.

## Capability matrix

| Capability | Status | UI to database evidence |
|---|---|---|
| Authentication | PASS | `/login` -> auth route -> session service -> hashed `Session`; unauthenticated E2E denial. |
| Organizations/RBAC | PASS | session membership supplies tenant and role; server permission and transition checks; security suite. |
| Excel/CSV import | PASS | `/excel` -> workbook routes -> `workbook-service` -> tenant-owned persisted file/profile/batch/facts. |
| Mapping and reuse | PASS | workbook review -> mapping service -> versioned rules/decisions; `MAPPING.REUSED` audit and E2E compatible-file reuse. |
| Validation | PASS | deterministic persisted severity, row, reason and guidance; blocking errors stop import; invalid-source E2E. |
| Forecast workspace | PASS | `/forecasts/[id]` -> forecast service/repository -> `ForecastLine`; exact decimal edits, filters and 100-line pagination. |
| Variance | PASS | Decimal actual-minus-forecast and current-minus-prior, including negative and zero-basis tests. |
| Commentary | PASS | version/optional-line context, tenant/version line validation, author and timestamp, append-oriented audit. |
| Submission/revision/approval | PASS | role/state transition matrix enforced in the application transaction; submitter cannot approve; full integration/E2E cycle. |
| CFO view | PASS | Revenue, Operating Expense, EBITDA, favorable/unfavorable variance, movement, outstanding action and state. |
| Locking | PASS | CFO-only transition plus database triggers protecting locked version and financial lines. |
| Audit/lineage | PASS | source file/sheet/row/mapping/batch lineage plus actor, organization, before/after, reason and version audit history. |
| Export | PASS | Director/CFO-only XLSX/CSV; approved/locked states; explicit export audit; E2E reads XLSX and reconciles totals. |
| Tenant isolation | PASS | repositories scope opaque IDs by session organization; cross-tenant workbook/forecast/comment tests return 404. |
| Performance | PASS | 10,000-row parse/profile/map and 1,000-row full import; bulk facts/lineage, chunked line upserts, paged UI. |
| Deployment | BLOCKED | No preview/production target or credentials. Production promotion was not authorized and is not required for local user validation. |

## Canonical paths

| Path | UI | HTTP boundary | Application | Repository/database |
|---|---|---|---|---|
| Import | `/excel`, `/excel/[id]` | `/api/excel/workbooks*` | `workbook-service` | `ExcelWorkbook`, profile, mapping, batch, error, facts and lineage |
| Forecast | `/forecasts/[id]` | line/comment/transition routes | `forecast-service` | tenant forecast repository, `ForecastLine`, `ForecastComment`, `AuditEvent` |
| Export | CFO workflow panel | `/api/forecasts/[id]/export` | forecast workspace calculation | approved/locked tenant version and append audit |

No canonical control is mock-only or client-authorized. Disabled navigation remains outside this MVP scope.

## Financial reconciliation

The certification fixture proves two independent equalities:

1. Accepted source forecast total equals persisted imported forecast facts.
2. Approved forecast-line total equals the generated export total after governed edits.

For the Phase 20 browser fixture:

- Accepted revision source: `$213,500,000.00`
- Persisted import: `$213,500,000.00`
- Final workspace/approved forecast: `$213,750,000.00`
- XLSX export: `$213,750,000.00`

The `$250,000.00` change is the audited Analyst revision, not an import discrepancy.

## Audit reconstruction

The cycle is reconstructable from `WORKBOOK.PROFILED`, `MAPPING.ACCOUNT_OVERRIDDEN`, `MAPPING.REUSED`, `WORKBOOK.CANONICAL_IMPORT_COMPLETED`, `FORECAST.LINE_UPDATED`, `FORECAST.COMMENT_ADDED`, `FORECAST.SUBMIT`, `FORECAST.REVIEW`, `FORECAST.REVISE`, resubmission, `FORECAST.APPROVE`, `FORECAST.LOCK`, and `FORECAST.EXPORTED`. Financial facts retain file hash, filename, sheet, source row, mapping version and import batch.

## Reliability bounds

- Upload: `.xlsx`/`.csv`, 5 MB compressed limit.
- XLSX: 50 MB declared expansion, 1,000 ZIP entries, 20 sheets, 50,000 rows, 200 columns/sheet and 10,000 formulas.
- Forecast workspace: 100 lines/page; exports remain complete and are not paginated.
- Measured locally: 10,000-row parse/profile/map `28.5 ms`; 1,000-row full import `1,246.5 ms`; 1,000-line bounded workspace load `82.5 ms`.

## Pilot boundary

Local controlled-pilot readiness is covered by deterministic seed identities, valid/invalid fixtures, clean migrations, health check, production build, session controls, tenant isolation, RBAC and rollback policy. Hosted malware scanning, private object storage, backups, monitoring, preview deployment and production deployment remain infrastructure gates; no production system was changed.
