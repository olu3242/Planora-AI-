# Planora Domain Model

## Aggregate boundaries

| Aggregate | Root | Key children | Invariant |
|---|---|---|---|
| Tenant security | Organization | Membership, RoleAssignment | Every access is scoped to one active membership |
| Financial dimensions | Dimension | DimensionMember, hierarchy state | Codes unique per organization and effective range |
| Actuals | ImportBatch | FinancialFact, LineageReference | Facts are committed only from validated batches |
| Metrics | MetricDefinition | CalculationDefinition, MetricValue | Values remain re-derivable from facts |
| Plan | Plan | PlanVersion, PlanLine, approval records | Locked versions cannot mutate |
| Forecast | Forecast | ForecastVersion, ForecastLine, overrides | Published versions cannot mutate |
| Mapping | Workbook | WorkbookProfile, MappingTemplate, MappingVersion, MappingRule, MappingSuggestion, MappingDecision, ImportBatch, ImportError | Import uses one approved immutable mapping version |
| Reconciliation | ReconciliationRun | results, exceptions | Result totals equal source minus canonical difference |
| Certification | Certification | CertificationDecision | Blocking DQ issues prevent certification |
| Variance | VarianceAnalysis | VarianceDriver, root cause | Driver contributions sum exactly to parent |
| Scenario | Scenario | ScenarioVersion, variables, results | Base version is never mutated |
| Decision | Recommendation | DecisionOption, Decision, approval | Only an authorized human creates/selects a Decision |
| Execution | Action | ActionOwner, ActionMilestone, Outcome, OutcomeMeasurement, Realization | Realization uses expected and realized fixed-point values |
| Agent | AgentDefinition | AgentRun, AgentEvidence, AgentRecommendation, AgentApproval | Runs persist even with no recommendation or failure |
| Reporting | ReportDraft | ReportApproval, published artifact | Publication always requires human approval |

## Core relationships

```text
Organization
  -> Membership -> User
  -> FiscalCalendar -> FiscalPeriod
  -> Dimension -> DimensionMember
  -> ImportBatch -> FinancialFact -> LineageReference
  -> MetricDefinition -> MetricValue
  -> Plan -> PlanVersion -> PlanLine
  -> Forecast -> ForecastVersion -> ForecastLine
  -> VarianceAnalysis -> VarianceDriver
  -> Scenario -> ScenarioVersion -> ScenarioResult
  -> Recommendation -> DecisionOption -> Decision
  -> Decision -> Action -> Outcome -> Realization
  -> AgentRun -> AgentRecommendation
```

## Value objects

- `Money(amount: Decimal, currency: ISO-4217)`; arithmetic rejects currency mismatch.
- `Percentage` stores an exact decimal ratio and explicit display scale.
- `PeriodKey` identifies a tenant fiscal period, never inferred from a calendar label alone.
- `DimensionKey` is the normalized set of applicable member IDs at a fact grain.
- `SourceReference` identifies source type, immutable batch, workbook/sheet, and compact row/cell range.
- `VersionState` exposes transition policies instead of free-form strings.

## State machines

Plan: `DRAFT -> SUBMITTED -> IN_REVIEW -> CHANGES_REQUESTED -> RESUBMITTED -> APPROVED -> LOCKED`.

Forecast: `DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> SUPERSEDED`.

Mapping: `DRAFT -> REVIEW_REQUIRED -> APPROVED -> RETIRED`; drift creates a new draft version.

Certification: `PENDING -> IN_REVIEW -> CERTIFIED | REJECTED | EXPIRED`.

Action: `OPEN -> IN_PROGRESS -> BLOCKED | COMPLETED | CANCELLED`.

## Deterministic reference calculations

```text
Gross Profit = Revenue - COGS
EBITDA = Gross Profit - Operating Expense
Revenue forecast = Volume * Price
Payroll forecast = Headcount * Average Compensation
Variance = Actual - Comparison Basis
Realization rate = Realized Recovery / Expected Recovery
```

Reference invariants are $150M - $40M - $23M = $87M EBITDA; variance drivers total -$7M; scenario recovery is +$4.7M; realized recovery is +$4.1M; realization is 87.2% when rounded to one decimal for display.

## Phase 2 implementation

The executable schema now represents `LegalEntity`, `BusinessUnit`, `Geography`, `Product`, `Customer`, `CostCenter`, `Account`, `Currency`, `FiscalCalendar`, `FiscalYear`, `FiscalPeriod`, `FinancialFact`, `LineageReference`, `MetricDefinition`, `CalculationDefinition`, `MetricDependency`, `MetricValue`, `Plan/PlanVersion`, and `Forecast/ForecastVersion`. Dimension members are Organization-scoped and effective-dated; relevant dimensions have self-referencing hierarchies.

`FinancialFact.grainKey` supplies sparse semantic uniqueness (ADR-010). Approved/locked PlanVersions and published/superseded ForecastVersions have both domain guards and PostgreSQL mutation triggers. Corrections create linked draft versions and immutable audit evidence.
