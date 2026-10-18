# Planora: Workflow OS + Flow Orchestration OS + Runtime OS

Status: architectural contract + initial TypeScript guardrails; **not an E2E certification**.
Source: user-supplied *Planora Automation & Orchestration Catalog*, 12 pages (working draft; proposals, not shipped capabilities).

## Single operating model

1. **Workflow OS** owns process definitions, human task queues, ownership, approvals, policies, fiscal periods, and business-facing run status.
2. **Flow Orchestration OS** owns durable state transitions, event routing, dependencies, human-wait timers, retry/backoff, compensations, tenant fan-out and dead-letter replay.
3. **Runtime OS** owns tenant-scoped step invocation, capability registration, idempotency, agent invocation, execution receipts, evidence, and fault classification.
4. **Financial Core** exclusively authorizes ledger writes, posting, reversal, close locks and payment-related business decisions.
5. **Integration edge (optional n8n)** receives intake, sends notifications, and invokes scoped Planora APIs. It never writes directly to the database or makes financial decisions.

The same `organizationId`, `runId`, `correlationId`, `policyVersion`, definition version and idempotency key flow through all three OS layers. The shared type/validation contract is in `src/lib/orchestration/catalog-contract.ts`. It is **not yet wired to persistence or authorization endpoints**.

## Catalog mapping

| Catalog | Workflow OS | Orchestration OS | Runtime OS / edge |
|---|---|---|---|
| A1–A7 intake | import review and mapping approvals | ingest, stage, wait, resume | parsing and external intake |
| B1–B6 bookkeeping | suggestion queue, duplicate decisions, rules | confidence routing and reminders | categorization/matching agents |
| C1–C5 reconciliation | match review, sign-off | exception routing and timers | matching and evidence |
| D1–D8 AP/AR | bill approvals, independent bank-detail checks | reminders, policy-based transitions | document extraction and notifications |
| E1–E7 close | owner tasks, controller/CFO approvals | period-aware dependency DAG and durable human-wait | completeness checks and report snapshot |
| F1–F5 reporting | draft review and release approval | report-ready to approved-to-delivered | narrative drafts and notification edge |
| G1–G9 FP&A | variance ownership and decision/action approvals | actual-to-reforecast lifecycle | scenario/variance agents |
| H1–H7 governance | segregation of duties and access approvals | blocked-state and exception routing | immutable audit/evidence |
| I1–I4 collaboration | user preferences | notification dispatch triggers | optional n8n delivery |
| J1–J6 operations | admin incident console | DLQ, replay, kill switch | backup/restore, health and model quality |
| K1–K4 support | human response ownership | intake and follow-up | low-risk integrations |

## Non-negotiable release gates

- Every mutation uses a core policy decision, recorded approval or pre-approved policy, role/SoD checks, tenant/entity scope and fiscal-period checks.
- Every state-changing transaction writes its domain event to an outbox atomically; consumers dedupe processed event keys.
- Approval waits persist across restarts; timed escalations are recoverable.
- Compensation is explicit and financial reversal is a separately authorized accounting operation, never a blind undo.
- Per-tenant and global pause/resume, limits and shadow mode must be enforced by execution, not just UI.
- n8n tokens are short-lived and scoped; webhook signatures and timestamps are verified; no raw credentials or financial data in notifications.
- End-to-end tests must prove tenant isolation, concurrent duplicate delivery, restart/replay, human approval, closed-period blocking, audit correlation, model confidence routing and kill-switch behavior.
- Licensing review is required before exposing n8n to customers.
- The alternative ESLint dependency candidate is not an OS feature and must be certified independently; no deployment is authorized by the clean candidate audit alone.

## First integration sequence

1. Reconcile existing workflow/agent registries with this contract; avoid introducing a second state machine.
2. Add persistent policy-versioned run envelopes and tenant-scoped transactional outbox.
3. Enforce authorization in the actual core posting and approval paths.
4. Implement durable human-wait, scheduler, DLQ and replay.
5. Bind catalog scenarios to executable handlers only after explicit test coverage.
6. Add OS command center for queues, exceptions, approvals, pause/replay and per-tenant audit.
7. Run PostgreSQL integration, browser E2E, fault-injection and exact-SHA CI security checks.

## Decisions still open

Durable engine (existing Postgres orchestration vs Temporal/Inngest), n8n licensing and exposure, launch integrations, auto-approval policy ownership, notification channels, retention and unattended AI boundaries. The catalog does not resolve these; do not assume decisions have been made.
