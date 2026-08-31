# Planora Target Architecture

## Architectural shape

```text
Browser / Next.js UI
        |
Server Actions and Route Handlers
        |
Application Services (authorization, transactions, orchestration)
        |
Domain (entities, policies, workflow state machines)
        |
Financial Calculation Engine (pure Decimal calculations and dependency graph)
        |
Repository Interfaces
        |
Prisma Repositories -> PostgreSQL
```

External concerns remain adapters:

```text
Spreadsheet Adapter -> parser, profiler, inference, mapping, export
AI Adapter          -> authorized tools over application services only
Notification Adapter-> audited event delivery
Observability       -> logs, metrics, traces, redaction
```

Spreadsheet cells, model prompts, HTTP request shapes, and vendor SDK objects never enter the domain as canonical entities.

## Runtime boundaries

- `src/app`: routes, layouts, route handlers, server actions; no financial formulas.
- `src/features`: user-facing workflow composition by capability.
- `src/application`: commands, queries, transaction boundaries, authorization calls.
- `src/domain`: framework-independent entities, value objects, state policies, calculations.
- `src/repositories`: tenant-scoped interfaces and Prisma implementations.
- `src/integrations/spreadsheets`: untrusted workbook boundary and round trip.
- `src/integrations/ai`: model provider boundary and allow-listed financial tools.
- `src/auth`: session resolution; organization context is derived server-side.
- `src/permissions`: permission catalog and centralized policy evaluation.
- `src/observability`: structured events, correlation IDs, redaction.

## Data architecture

- PostgreSQL is the production system of record; Prisma owns migrations.
- IDs are opaque. Every tenant-owned table carries `organizationId` and uses compound indexes/constraints where applicable.
- Monetary values use database `Decimal` and a domain `Money` value object with currency.
- Approved/locked/published versions are immutable through application policies and database constraints where practical.
- Audit events are append-only. Lineage references point to source batches and compact ranges, not one audit row per cell.
- Uploaded workbooks are stored outside the database in production; metadata, hashes, scan status, and lineage live in the database.

## Request security flow

```text
Request -> authenticated session -> active membership -> permission
        -> tenant-scoped repository -> validated command -> transaction
        -> audit event -> response
```

Client-supplied organization IDs are never trusted to establish scope. Resource lookup and mutation use the organization resolved from the session.

## Financial engine

The engine is pure TypeScript operating on Decimal-compatible value objects. One dependency graph powers metrics, planning, forecasting, and scenario recalculation. Reconciliation and variance are deterministic functions with exact invariants. AI may call these functions through authorized application tools but cannot replace them.

## Excel pipeline

```text
Upload quarantine -> type/size/hash/scan -> parse values/formulas without execution
-> profile -> infer -> mapping draft -> human review -> validate
-> import transaction -> reconciliation -> DQ -> human certification
```

Wide and long formats are MVP-certified. Formula metadata is classified and preserved; macros are never executed.

## Deployment topology

Initial target: one Next.js service, PostgreSQL, object storage, and a background-job mechanism only when synchronous limits require it. Preview and production use separate databases, storage, secrets, and audit streams. The modular monolith keeps financial transactions coherent while preserving adapter and domain boundaries for later extraction.

## AI boundary

Agents write only `AgentRun` and `AgentRecommendation`. Tool authorization reuses the same session, tenant, permission, and repository policies as UI/API calls. Protected financial mutations, certification, Decision creation, forecast publication, and report publication are unavailable as agent tools.
