# Planora — Traceability Matrix

Status: Living document — **update every time a feature moves between COMPLETE / PARTIAL / MISSING / BLOCKED.** This file exists to prevent the single most common failure mode in AI-assisted builds: many screens getting built while the underlying pain-point-to-evidence chain stays incomplete.

Related: `docs/PAIN-POINT-MATRIX.md`, `docs/E2E-ACCEPTANCE.md`, `docs/IMPLEMENTATION-STATUS.md`, `docs/TEST-STRATEGY.md`

---

## 1. Purpose

Every row connects: **Pain Point → Requirement → Feature → Domain Object(s) → API → UI → Test(s) → E2E Evidence → Status.**

A feature does not get added to this file when a screen is built for it. It gets added when there is something to trace — i.e., when at least the Domain Object and API columns are real. Before that point, it belongs in `docs/GAP-MATRIX.md` as MISSING or PARTIAL, not here.

If a row's Status is COMPLETE but any column is empty or points to something that doesn't exist in the repo, that is a documentation defect — fix the row or fix the status, immediately, don't leave it inconsistent.

---

## 2. How to Read Status

- **COMPLETE** — every column populated, all referenced tests pass, E2E evidence exists in `evidence/`.
- **PARTIAL** — some columns populated; note exactly what's missing in the row.
- **BLOCKED** — populated columns exist but progress is stopped by a named external dependency.
- **NOT STARTED / MISSING** — pain point and requirement identified, nothing else built yet.

---

## 3. Matrix

Populate this table as implementation proceeds. Rows below are seeded examples showing the expected level of specificity — replace with real paths/routes/test names as they're implemented, do not leave placeholder rows marked COMPLETE.

| Pain Point | Requirement | Feature | Domain Object(s) | API | UI Route | Tests | E2E Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| Hard to explain EBITDA miss | Automated variance decomposition with drillable drivers | Variance Intelligence | `Variance`, `VarianceDriver`, `MetricValue` | `GET /api/variances/:id/explain` | `/analyze/variances` | `variance-calculation.test`, `variance-api.test`, `variance-investigation.e2e` | `evidence/e2e/variance-investigation/` | NOT STARTED |
| Spreadsheet dependency for planning | Driver-based budget/forecast entry with propagation | Planning Engine | `Plan`, `PlanVersion`, `PlanLine`, `PlanningDriver` | `POST /api/plans/:id/lines`, `POST /api/plans/:id/submit` | `/plan/budget` | `driver-propagation.test`, `plan-workflow.e2e` | `evidence/e2e/plan-workflow/` | NOT STARTED |
| Excel migration complexity | Map arbitrary FP&A workbook into canonical model without rebuild | Universal Excel Mapper | `ExcelWorkbook`, `ExcelWorkbookVersion`, `ExcelMappingTemplate`, `ExcelMappingRule`, `MappingAlias` | `POST /api/excel/import`, `POST /api/excel/:id/mappings` | `/data/excel` | `mapping-engine.test`, `alias-resolution.test`, `excel-import-mapping.e2e` | `evidence/e2e/excel-import/` | NOT STARTED |
| Numbers aren't trusted | Reconciled import with $0-difference verification | Reconciliation Engine | `Reconciliation`, `ReconciliationDifference`, `ExcelImportBatch` | `POST /api/excel/:id/reconcile` | `/data/reconciliation` | `reconciliation-engine.test`, `excel-reconciliation.e2e` | `evidence/reconciliation/` | NOT STARTED |
| Lost management actions | Decision → Action → Outcome chain with realization tracking | Decision Hub | `Decision`, `DecisionOption`, `Action`, `Outcome` | `POST /api/decisions`, `POST /api/actions/:id/complete`, `POST /api/outcomes` | `/decide` | `decision-lifecycle.test`, `decision-action-outcome.e2e` | `evidence/e2e/decision-outcome/` | NOT STARTED |
| Slow what-if analysis | Dynamic scenario recalculation without mutating approved plans | Scenario Lab | `Scenario`, `ScenarioVariable`, `ScenarioResult` | `POST /api/scenarios`, `POST /api/scenarios/:id/recalculate` | `/simulate/scenarios` | `scenario-recalc.test`, `scenario-analysis.e2e` | `evidence/e2e/scenario-analysis/` | NOT STARTED |
| Manual repetitive analysis | Grounded conversational Q&A over governed metrics | Planora Copilot | `MetricDefinition`, `MetricValue` (read-only consumer) | `POST /api/copilot/query` | `/ai/copilot` | `copilot-grounding.test`, `copilot-grounding.e2e` | `evidence/e2e/copilot/` | NOT STARTED |
| Reactive finance teams | Agent recommends within approval gate, never auto-commits | Workflow, Variance, Commentary and Review Assistants | `AgentDefinition`, `AgentRun`, `AgentRecommendation`, `AgentFeedback`, `RuntimeExecution` | `POST /api/agents/run`, `POST /api/agent-recommendations/:id/feedback` | `/forecasts/:id#assistants` | `agent-runtime.test`, `agentic-runtime.test`, canonical Playwright workflow | `evidence/mvp-e2e/` | CERTIFIED |

Add rows as capabilities are implemented. Do not batch-populate this table from the PRD at the start of a project — populate it as evidence exists, per §1.

---

## 4. Maintenance Rule

This file is checked, not just written. Before marking any capability COMPLETE in `docs/IMPLEMENTATION-STATUS.md` or a delivery report (CLAUDE.md §7), confirm its row here is fully populated and every referenced path/route/test actually exists in the repository at the stated location. A row that references a test file that doesn't exist is worse than no row at all — it actively misleads the next session.

When a schema, route, or test file is renamed, update the corresponding row in the same commit. Stale traceability rows are a form of technical debt and should be tracked in `docs/KNOWN-GAPS.md` if they can't be fixed immediately.

## 5. Phase 0 Target Traceability

This target matrix prevents orphaned requirements before executable paths exist. It does not claim implementation.

| Requirement | Phase | Domain object(s) | Implementation target | Test target | Status |
|---|---:|---|---|---|---|
| Login, tenant and permission enforcement | 1 | User, OrganizationMembership, RoleCode, Session | `src/auth`, `src/permissions`, `src/repositories/organization-repository.ts` | `environment.test`, `permissions.test`, `authorization.test`, `foundation.e2e` | COMPLETE |
| Append-only audit | 1 | AuditEvent | `src/audit/audit.ts`, migration trigger | `audit.test`, `foundation.test` | COMPLETE |
| Canonical financial truth and metrics | 2 | FinancialFact, MetricDefinition, MetricValue | domain calculation engine/repositories | $87M financial fixture | SPECIFIED |
| Lineage and version immutability | 2 | LineageReference, PlanVersion, ForecastVersion | application policies/database constraints | lineage and mutation-denial tests | SPECIFIED |
| Excel profiling and mapping | 3 | WorkbookProfile, MappingVersion, MappingDecision | spreadsheet adapter and review UI | wide/long/unmapped/drift E2E | SPECIFIED |
| Canonical import | 3 | ImportBatch, ImportError, FinancialFact | validated import service | fixture fact/lineage integration | SPECIFIED |
| Reconciliation and data quality | 4 | ReconciliationRun, DataQualityIssue | deterministic controls and stewardship UI | discrepancy-to-$0 E2E | SPECIFIED |
| Certification | 4 | Certification, CertificationDecision | human approval service | blocking issue denial | SPECIFIED |
| Planning and deterministic forecast | 5 | Plan, Forecast, DriverDefinition, Assumption | shared calculation graph/workspaces | driver/workflow E2E | SPECIFIED |
| Command Center and variance | 6 | VarianceAnalysis, VarianceDriver, Exception | variance engine and investigation UI | -$7M child-sum/source drill | SPECIFIED |
| Scenario and human decision | 7 | Scenario, Recommendation, Decision | scenario service and Decision Hub | +$4.7M/human authority | SPECIFIED |
| Action, outcome and reforecast | 8 | Action, Outcome, Realization | closed-loop application service | $4.1M/87.2%/new version | SPECIFIED |
| Copilot and governed agents | 9 | AgentRun, AgentEvidence, AgentRecommendation | authorized deterministic tool adapter | grounding/approval/prohibited action | SPECIFIED |
| Reporting and Excel round trip | 10 | ReportDraft, ExportBatch, ChangeReview | reporting/export/re-import adapters | publish and new-version E2E | SPECIFIED |
| Production certification | 10 | DeploymentEvidence | CI/CD, observability and runbooks | security/performance/full E2E | SPECIFIED |

## 6. Phase 2 implemented traceability

| Pain Point | Requirement | Feature | Domain Object(s) | API | UI Route | Tests | E2E Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| Numbers are not trusted | Canonical facts produce exact explainable metrics | Financial Core | `Account`, `FiscalPeriod`, `FinancialFact`, `MetricDefinition`, `MetricValue`, `LineageReference` | `GET /api/financial/statement`, `GET /api/metrics/:id/lineage`, tenant-scoped account/fact routes | `/actuals` | `money.test`, `financial-domain.test`, `phase2-fixture.test`, `financial-core.test`, `authorization.test`, `financial-core.e2e` | `evidence/phase-2/actuals-1440.png` | COMPLETE |
| Approved baselines can be silently changed | Corrections are new attributed drafts | Version Foundations | `Plan`, `PlanVersion`, `Forecast`, `ForecastVersion`, `AuditEvent` | correction service boundary; no mutation API exposed | Version UI deferred to planning phase | `financial-domain.test`, `financial-core.test` | Database trigger and audit evidence in certification | COMPLETE |
