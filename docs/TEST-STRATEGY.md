# Planora Test Strategy

## Test layers

### Forecast MVP executable suites

- Unit: Decimal precision and half-even rounding, hierarchy/fiscal validation, dependency cycle detection, zero division, grain stability, and version rules.
- Financial: exact $150M/$40M/$110M/$23M/$87M fixture, margins, and dimension reconciliation.
- Integration: database aggregation/cache, lineage, duplicate-grain rejection, protected-version triggers, correction draft, and audit.
- Security: cross-tenant Organization, Account, FinancialFact, and MetricValue denial.
- Browser: login, compatible mapping reuse, validation, draft update, commentary, submission, revision, approval, CFO review, lock, exact export reconciliation, invalid import, and 375/430/768/1024/1440 checks.
- Performance: 10,000-row parse/profile/map and 1,000-row full canonical import with bounded workspace pagination.

| Layer | Purpose | Gate examples |
|---|---|---|
| Unit/domain | Pure policies and calculations | Decimal money, workflow transitions, permission decisions |
| Financial | Exact known-good finance outputs | $87M EBITDA, -$7M variance, +$4.7M/+4.1M, 87.2% |
| Integration/database | Transactions, constraints, tenant repositories | Clean migration, immutable versions, audit atomicity |
| API/application | Validation, authz, error contract | Direct ID attacks, prohibited state changes |
| Excel | Safe parsing, inference, mapping, drift, reconciliation | Wide/long FY26 fixture and deliberate unmapped account |
| Agent | Evidence and approval boundaries | Every run logged; protected objects cannot be written |
| E2E | Real browser workflow | Phase-specific vertical journeys and final acceptance chain |
| Responsive/accessibility | Usable workflows | 375, 430, 768, 1024, 1440; keyboard/labels/contrast |
| Security/performance | Abuse and operational bounds | upload limits, rate controls, large workbook, isolation |

## Required invariants

- Money calculations never use JavaScript floating point as canonical values.
- Gross Profit and EBITDA match exact expected decimals.
- Reconciliation difference is exact and explainable.
- Variance children sum to the parent.
- Locked/published versions reject mutation.
- Cross-tenant resource IDs return denial without disclosure.
- Agent recommendations always contain evidence and agents cannot approve themselves.
- Report publication and Decision creation remain human-gated.

## Fixtures and environments

Tests use deterministic seeded organizations A and B, CFO/Director/Analyst identities, tenant-owned resources with predictable opaque IDs, and `FY26_Forecast.xlsx` containing P&L, Revenue, Headcount, Opex and Assumptions sheets. Database tests run against an isolated migrated database; tests must not depend on execution order.

## Evidence

CI reports actual test counts and stores Playwright traces/screenshots for failed and certification journeys. Phase evidence records commit, environment, seed/fixture hash, commands, results, and browser viewport. Existence checks do not qualify as workflow evidence.

## Certification command order

Install -> environment validation -> generate -> clean migration -> seed -> lint -> typecheck -> unit/domain -> integration/database -> financial -> Excel -> security/RBAC -> build -> E2E -> responsive/accessibility.
