# Planora AI Agent Architecture

## Lifecycle

`OBSERVE -> ANALYZE -> RECOMMEND -> REQUEST APPROVAL -> HUMAN DECISION -> AUTHORIZED ACTION -> OUTCOME`.

Agents read through tenant-scoped, permission-checked application queries and compute only through approved deterministic tools. They write `AgentRun` and `AgentRecommendation`; they do not write approved plans, locked versions, published forecasts, certified metrics, Decisions, or published reports.

## Tool boundary

Each tool declares required permission, allowed input schema, tenant scope, deterministic implementation, evidence output, rate/resource limit and audit behavior. Tool calls cannot select a different organization than the authenticated context. Protected mutation tools do not exist.

## Persistence

Every run records agent/version, trigger, task, actor/organization, referenced inputs, tool calls/results, evidence, output/no-output, confidence, status, timestamps and error. Recommendations persist through approval/rejection and later link to outcome/realization.

## Initial order

Variance Agent and Scenario Agent use already-certified engines first, followed by Revenue and Decision agents. Forecast, Cost, Cash, Governance and Reporting agents are added only when their deterministic data/tools and approval gates exist.

## Failure behavior

Insufficient data produces a logged `insufficient_data` run and no recommendation. Dependency errors produce `error` and cooldown. Ambiguous authorization produces `authorization_undetermined` and fails closed.

## Implemented Forecast MVP boundary

The Forecast MVP implements four deterministic, provider-independent assistants: Workflow, Variance, Commentary, and Review. They use A1 RECOMMEND or A2 ASSIST authority only. Their typed tool allow-lists contain tenant-scoped reads and commentary preparation; no financial write, mapping, workflow approval, lock, validation override, or identity tool exists.

`AgentDefinition`, `AgentRun`, `AgentRecommendation`, and `AgentFeedback` persist version, authenticated actor/organization, workflow context, evidence, output, and human decision. Feedback is evaluation data only. It carries `requiresVersionChange = true` and cannot silently mutate prompts, accounting logic, permissions, workflow rules, or the running definition.

Human workflow transitions use `PLANORA.RUNTIME.COMMAND.EXECUTOR` through `RuntimeExecution`. The runtime supplies idempotency, bounded safe retries, failure classification, correlation, and append-only audit events. It cannot elevate identity, alter governance, or heal financial data. The deterministic workflow remains available when assistants are read-only or disabled.
