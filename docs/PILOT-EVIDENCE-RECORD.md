# Pilot Evidence Record

Create one copy per participant/session. Use process measures only; do not record source financial values, customer names, or other unnecessary sensitive data.

## Session

- Session ID:
- Organization/pilot code:
- Participant role and FP&A experience band:
- Date:
- Facilitator:
- Forecast version ID:
- Started/finished:
- Completed canonical workflow: YES/NO
- Blocker, if incomplete:

## Before Planora baseline

| Measure | Value |
|---|---:|
| Total cycle effort (minutes) | |
| Analyst preparation (minutes) | |
| Manager review (minutes) | |
| Commentary/report preparation (minutes) | |
| Excel files | |
| Workbook versions | |
| Copy/paste steps | |
| Manual reconciliations | |
| Messages/follow-ups | |
| Approval handoffs | |
| Revision cycles | |
| Error-correction steps | |

Major pain points:

## Planora observation

Record total task minutes, help requests, backtracks, errors, manual steps outside Planora, external handoffs and completion state. Attach only opaque correlation IDs/forecast version IDs needed for matching persisted audit events.

The system can derive import duration, mapping reuse, validation exceptions, draft-to-submit time, submit-to-approval time, revision count, cycle duration and event count through `forecastCycleMetrics`.

## Feedback

Rate 1 (low) to 5 (high):

| Measure | Rating | Short comment |
|---|---:|---|
| Upload ease | | |
| Mapping clarity | | |
| Validation usefulness | | |
| Trust in financial results | | |
| Forecast workspace usability | | |
| Variance usefulness | | |
| Commentary usefulness | | |
| Review/approval clarity | | |
| Audit usefulness | | |
| Export usefulness | | |
| Likelihood to reuse | | |
| Likelihood to recommend | | |
| Willingness to adopt/pay | | |

- Estimated minutes saved:
- Biggest remaining blocker:
- Optional session notes:

## Before/after calculation

- `Time Saved = Baseline Effort - Planora Effort`
- `Effort Reduction % = Time Saved / Baseline Effort * 100` (report insufficient data when baseline is zero/missing)
- `Mapping Reuse % = Reused Mappings / Compatible Uploads * 100`
- `Approval Cycle Reduction = Baseline Approval Minutes - Planora Submit-to-Approval Minutes`

Do not aggregate or publish results until definitions are consistent across sessions. Report `INSUFFICIENT_DATA` rather than extrapolating.

## Evidence decision

Classify each request as `MUST_FIX`, `VALIDATED_NEXT`, `LATER`, `REJECTED`, or `INSUFFICIENT_EVIDENCE`. `VALIDATED_NEXT` requires repeated evidence across sessions. Choose one session/program decision: `CONTINUE_MVP_PILOT`, `READY_FOR_BETA`, `ITERATE_CORE_WORKFLOW`, `PIVOT_REQUIRED`, or `STOP`.
