# Controlled FP&A Validation Plan

Engineering entry state: `READY_FOR_CONTROLLED_USER_VALIDATION`.

Product state: `MVP_PARTIALLY_VALIDATED`.

## Objective

Measure how many minutes of manual FP&A effort Planora eliminates from one complete monthly forecast cycle without reducing financial trust.

## Participants and data

Use the three core personas only: Analyst, FP&A Director, and CFO. Use the synthetic Planora Preview tenant and `tests/fixtures/Planora_Pilot_Monthly_Forecast.xlsx`; do not upload real customer data. Create one opaque session ID and one copy of `PILOT-EVIDENCE-RECORD.md` per participant/session.

## Protocol

1. Record the participant's conventional-process baseline by activity before showing Planora.
2. Run `USER-VALIDATION-KIT.md` without developer intervention or coaching beyond its task statements.
3. Record stage timestamps, help requests, errors, backtracks, retries, validation issues, revision count, external/manual steps, and completion state.
4. Confirm database/dashboard/workspace/XLSX/CSV totals reconcile exactly.
5. Collect usability, trust, time-saving, reuse, value, frustration, and blocker feedback.
6. Store process measures only. Keep real user outcomes separate from synthetic engineering records.
7. Classify requests as `MUST_FIX`, `VALIDATED_NEXT`, `LATER`, `REJECTED`, or `INSUFFICIENT_EVIDENCE`.

## Pass and stop rules

A session passes when the participant completes the canonical workflow without developer intervention, exact reconciliation holds, and no critical security or financial-integrity concern occurs. Any cross-tenant exposure, untraceable number, non-zero unexplained reconciliation, protected-state mutation, or real-data upload stops the pilot.

Do not claim `MVP_VALIDATED` from engineering tests. Repeated participant evidence is required before `READY_FOR_BETA` or product expansion.
