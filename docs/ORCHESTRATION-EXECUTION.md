# Planora Orchestration Runtime Execution

This slice turns the orchestration domain into an executable, governed runtime without granting agents direct financial mutation authority.

## Implemented

- Step handler registry with duplicate-registration protection.
- Workflow-run store and runtime-execution store interfaces for durable adapters.
- Deterministic idempotency key scoped by organization, workflow run, workflow version and step.
- Ready-step execution with state persisted before and after handler invocation.
- Human approval steps stop execution and never invoke an execution handler.
- Successful execution records evidence before completing the workflow step.
- Failed execution records the error, fails the workflow run and leaves dependent financial mutations pending.
- In-memory stores support deterministic unit certification without pretending database durability exists.

## Pending

- Prisma models/migration for durable workflow runs, step runs and runtime execution records.
- Authenticated API/service boundary for workflow start, resume, approval and cancellation.
- Retry policy with bounded backoff and error categorization.
- Compensation handlers for reversible integration actions.
- Runtime adapters for accounting posting, reconciliation, actuals sync, forecast and insight services.
- AuditEvent integration and operational telemetry.
- Playwright close-to-forecast browser journey.
- Full repository certification pipeline.

## Safety invariant

AI/agent handlers may analyze or recommend. Financial mutation handlers must be deterministic authorized service adapters and may only become ready after their declared dependencies and approval gates succeed.
