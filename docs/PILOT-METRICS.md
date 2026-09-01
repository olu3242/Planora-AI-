# Pilot Metrics

Primary metric: **manual FP&A effort eliminated per forecast cycle**.

## Baseline record

Record participant role/experience, pilot code, upload/preparation, mapping, reconciliation, forecast update, variance investigation, commentary, approval chase/rework, reporting/export, total duration, workbook/version count, copy/paste steps, manual reconciliations, follow-ups, handoffs, revision cycles, and error-correction steps.

## Planora session record

Record session start/end, completed stages, failures, retries, validation issues, revision count, time to submission, approval and export, manual steps outside Planora, help requests, backtracks, and completion state. Persist only opaque correlation IDs and forecast-version IDs needed to match audit events.

`forecastCycleMetrics` derives import duration, mapping reuse, validation exceptions, draft-to-submit time, submit-to-approval time, revision count, cycle duration, and event count. The canonical audit provides stage completion evidence.

## Outcome formulas

- `Time Saved = Baseline Total Minutes - Planora Total Minutes`
- `Effort Reduction % = Time Saved / Baseline Total Minutes * 100`
- `Mapping Reuse % = Reused Mappings / Compatible Uploads * 100`
- `Approval Cycle Reduction = Baseline Approval Minutes - Planora Submit-to-Approval Minutes`

Use `INSUFFICIENT_DATA` for missing/zero denominators. Do not seed or infer real outcomes.

## Copilot measures

Existing persisted records supply recommendation ID, forecast version, observed financial facts/evidence, actor, creation time, assistant definition/version, decision (`ACCEPTED`, `EDITED`, `REJECTED`), decision time, original content, and final edited content. `AgentRun.startedAt/completedAt/status` supplies latency and failure measures. Provider/model is not applicable: current assistants are deterministic and do not call an external model.

- acceptance rate = accepted / decided recommendations
- edit rate = edited / decided recommendations
- rejection rate = rejected / decided recommendations
- latency = completedAt - startedAt
- failure rate = error runs / completed runs

The pilot question is whether commentary assistance reduces analyst effort without reducing trust. Agent usage is not evidence of financial correctness.
