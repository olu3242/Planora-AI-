# Planora Dependency-Aware Implementation Plan

## Delivery rule

Each phase is a vertical capability chain with domain, persistence, server operation, authorization, audit, UI, tests, and browser evidence. A later phase cannot be certified while a required earlier gate is broken.

| Phase | Vertical slice | Entry dependency | Certification gate |
|---:|---|---|---|
| 0 | Audit and architecture | Baseline | Repository truth, architecture, domain, security, test strategy, no unidentified blocker |
| 1 | Login -> tenant -> permission -> audited shell | Phase 0 | Install, migration, seed, lint, typecheck, tests, build, login/RBAC/isolation E2E |
| 2 | Fact -> metric -> exact calculation -> lineage | Phase 1 | Dimensions/facts, $87M EBITDA, precision, immutability, tenant tests |
| 3 | Upload -> profile -> map -> validate -> import | Phase 2 | Wide/long fixture, ambiguity review, drift, canonical facts and lineage |
| 4 | Import -> reconcile -> diagnose -> resolve -> certify | Phase 3 | Blocking DQ control and exact $0 reconciliation journey |
| 5 | Certified actuals -> drivers -> forecast -> approve -> publish | Phase 4 | Deterministic calculation, workflow, published immutability/new version |
| 6 | Actual + forecast -> -$7M exception -> root cause -> source | Phase 5 | Decomposition child sum, thresholds, Command Center drilldown |
| 7 | Variance -> scenarios -> +$4.7M recommendation -> human decision | Phase 6 | Shared engine, comparison, human authority, audit |
| 8 | Decision -> action -> $4.1M outcome -> 87.2% -> reforecast | Phase 7 | Ownership, measurement, realization, new forecast version |
| 9 | Question/trigger -> governed tool -> evidence -> recommendation | Phase 8 | Agent provenance, grounded Copilot, approval and prohibited-action tests |
| 10 | Report/export -> Excel edit -> re-import -> review -> new version | Phase 9 | Round trip, publish gate, hardening, complete unmocked E2E |

## First implementation batches

1. Foundation kernel: Next.js runtime, environment validation, PostgreSQL/Prisma schema, seed identities, session login, centralized permissions, tenant repositories, append-only audit, app shell, CI and test harness.
2. Financial truth: Organization dimensions, fiscal periods, accounts, facts, Decimal calculation graph, metric registry, lineage, immutable version guards.
3. Trusted Excel actuals: secure upload, FY26 fixture, profiler, wide/long mapping, review and import transaction, reconciliation/DQ/certification.
4. Forward and exception flow: driver forecast publication, Command Center, exact variance decomposition and lineage drill.
5. Closed loop: scenarios, recommendation, human decision, action/outcome, realization, reforecast.
6. Governed intelligence and interoperability: Copilot/agents, reporting approval, export metadata, re-import diff/approval, production certification.

## Dependency graph

```text
P0 -> P1 -> P2 -> P3 -> P4 -> P5 -> P6 -> P7 -> P8 -> P9 -> P10
                 |                       ^
                 +-- lineage/audit ------+
```

Security, tenant isolation, RBAC, audit, lineage, precision, accessibility, observability, performance, and documentation are extended in every phase rather than deferred.

Execution status: Phases 0, 1, and 2 are locally certified. Phase 3 is the active next boundary.
