# Planora Data Governance

## Trust lifecycle

```text
RECEIVED -> PROFILED -> MAPPED -> VALIDATED -> IMPORTED
-> RECONCILED -> QUALITY_REVIEWED -> CERTIFIED -> EXPIRED/SUPERSEDED
```

Only certified data is eligible as the default basis for published planning, forecast, management reporting, Copilot, and agent recommendations.

## Metric governance

Each `MetricDefinition` records name, business definition, deterministic formula, owner, steward, sources, refresh cadence, quality policy, certification policy, access policy, and downstream consumers. `MetricValue` records the version/period/dimensions, calculation version, freshness, quality and lineage.

## Data quality

Rules have scope, deterministic expression, severity (`INFO`, `WARNING`, `ERROR`, `BLOCKING`), owner, effective date, and version. Issues persist independently from later reruns; a steward resolves or dismisses them with reason and evidence. `BLOCKING` issues prevent certification.

Initial controls cover invalid/unmapped accounts, missing fiscal periods/cost centers, duplicate facts, incorrect signs, currency mismatch, stale data, mapping drift, excluded rows, aggregation difference, and reference workbook reconciliation.

## Lineage

Every material number supports:

```text
MetricValue -> CalculationDefinition -> FinancialFact
-> ImportBatch -> MappingVersion -> Workbook hash -> Sheet/range
```

Lineage stores compact source ranges and transformation references. The original immutable file hash and mapping version allow reproduction without a cell-per-audit-row design.

## Certification

A certification decision records scope, source/reconciliation/DQ state, reviewer, decision, reason, timestamp, and expiry. Certification is a human-only operation and cannot be performed by an agent or broad auto-approval policy.

## Retention and privacy

Retention is tenant-configured subject to legal/audit minimums. Exports and logs exclude credentials and minimize personal data. Deletion policies preserve legally required financial audit and recommendation evidence through tombstoning/anonymization rather than rewriting history.
