# Planora Architecture Decisions

## ADR-001: Dependent implementation branch

- Date: 2026-08-30
- Decision: Base local `feat/phase-1-foundation` on PR #1 HEAD without merging PR #1.
- Reason: preserves ancestry and respects explicit merge authorization.
- Consequence: implementation PR must remain dependent on or later be rebased after baseline merge.

## ADR-002: Modular monolith

- Decision: Start with one Next.js/TypeScript deployable containing strict application/domain/repository/adapter boundaries.
- Reason: financial workflows need coherent transactions; current scale does not justify distributed consistency cost.
- Consequence: boundaries must remain import-enforced and independently testable.

## ADR-003: PostgreSQL and Prisma

- Decision: Use PostgreSQL as the production system of record and Prisma migrations/repositories.
- Reason: aligns with baseline stack and supports Decimal, constraints, transactions, and mature operations.
- Consequence: local/CI tests require an isolated PostgreSQL service; hosted credentials remain external.

## ADR-004: Session authentication with centralized permissions

- Decision: Use server-resolved sessions, memberships, and a permission catalog; roles are permission bundles.
- Reason: satisfies tenant isolation and avoids handler-level role-name checks.
- Consequence: every protected query/mutation accepts an authorization context, not a client tenant ID.

Implementation note: Phase 1 uses first-party scrypt password verification and random hashed database sessions so local certification has no third-party credential dependency. Identity remains an adapter boundary for later enterprise SSO.

## ADR-005: One deterministic financial graph

- Decision: Metrics, plans, forecasts, and scenarios share one pure Decimal calculation graph.
- Reason: prevents inconsistent finance engines and keeps AI explanatory rather than authoritative.

## ADR-006: Published financial versions are immutable

- Decision: Approved plans and published forecasts reject in-place mutation; corrections create a new attributable version.
- Reason: preserves comparison, audit, and management authority.

## ADR-007: Excel and AI remain adapters

- Decision: Workbook and model-provider representations terminate at adapter boundaries.
- Reason: external/untrusted formats must not define canonical finance or bypass governance.

## ADR-008: AI cannot certify financial truth

- Decision: Certification, Decision creation, forecast publication, and report publication remain human-only operations.
- Reason: deterministic evidence and accountable authority cannot be delegated to model output.

## ADR-009: Actions and outcomes close the forecast loop

- Decision: Realized outcome evidence may seed a new forecast version through explicit workflow, never rewrite historical facts.
- Reason: organizational learning must remain attributable and reproducible.

## ADR-010: Canonical financial fact grain

- Date: 2026-08-31
- Decision: Persist a deterministic SHA-256 `grainKey` over account, period, scenario, currency, source/version context, and normalized optional dimension identifiers; enforce uniqueness with `(organizationId, grainKey)`.
- Reason: PostgreSQL unique constraints treat nullable dimension values as distinct, which can admit semantic duplicates at a sparse multidimensional grain.
- Consequence: fact writers must use `financialFactGrain`; the database remains the final duplicate guard. The hash contains identifiers only, never monetary values.

## ADR-011: Decimal calculation and presentation policy

- Date: 2026-08-31
- Decision: Store facts as `Decimal(24,6)`, derived metrics as `Decimal(28,10)`, calculate with Decimal.js at precision 40 and half-even rounding, and round only at presentation boundaries.
- Reason: deterministic financial results cannot rely on binary JavaScript floating point.
- Consequence: APIs and services exchange exact decimal strings. Currency presentation uses currency minor units; percentages expose at most four decimal places.

## Open decisions

- Hosted platform, object storage, malware scanner, telemetry vendor, email provider, and production region require infrastructure selection before hosted certification.
- Session/auth library choice will be finalized during Phase 1 after compatibility and security evaluation; the contract above is fixed even if the library changes.
