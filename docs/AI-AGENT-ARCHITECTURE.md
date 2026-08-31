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
