# Planora FP&A User Validation Kit

Use one finance user, the Planora demo dataset, and a timer. Do not coach the participant beyond the task statements. Record blockers verbatim.

## Pilot assets

- `tests/fixtures/Planora_Pilot_Monthly_Forecast.xlsx` is the participant-facing synthetic workbook. Its Forecast sheet contains period, GL account, cost center, actual, prior forecast, and current forecast fields; supporting expense detail covers payroll/people expense, software/services, travel, and facilities without adding workforce planning.
- `FY26_Forecast.xlsx`, `FY26_Forecast_Revision.xlsx`, and `FY26_Forecast_Invalid.csv` remain the automated mapping-reuse and invalid-path fixtures.
- All values and organization labels are synthetic.

## Current state interview

1. How long does the monthly forecast take from source collection to approval?
2. How many workbooks and source systems are involved?
3. Where does copy/paste occur, and roughly how many times?
4. How many reconciliations are performed?
5. How many email, Teams, or Slack follow-ups are typical?
6. Where do errors or rework most often occur?
7. How are approvals and revision reasons tracked?
8. How is prior-cycle history retained and retrieved?
9. Which task is most repetitive?
10. Which task creates the most delay?

Record the current-cycle baseline in minutes for preparation, mapping, validation/reconciliation, forecast updates, commentary, follow-up, approval and export.

## Planora task script

1. Sign in as the Analyst and open Excel imports.
2. Upload `FY26_Forecast.xlsx`; inspect the profile and preview.
3. Resolve `Shared Programs` to Operating Expense.
4. Upload `FY26_Forecast_Revision.xlsx` and confirm mapping reuse.
5. Validate/import and confirm no blocking errors.
6. Open the forecast cycle, find NA Industrial Revenue, and update it.
7. Review actual variance and forecast movement; add evidence-based commentary.
8. Submit for review.
9. Sign in as the FP&A Director, begin review, and request a revision with a reason.
10. As Analyst, revise and resubmit.
11. As Director, review and approve.
12. As CFO, review Revenue, Operating Expense, EBITDA, material variances, movements and audit history.
13. Lock the forecast and export XLSX.
14. Confirm the export total equals the approved Planora total.
15. Upload `FY26_Forecast_Invalid.csv`; confirm issues block progression and source values are not silently corrected.

Capture task completion time, help requests, errors, backtracks and abandoned steps.

## Post-test questions

Rate 1 (low) to 5 (high): ease of use, validation trust, calculation trust, mapping-reuse value, variance usefulness, workflow clarity, likelihood to reuse and willingness to pay.

Ask four open questions:

1. Which step was confusing or slower than expected?
2. How much time would this remove from a normal forecast cycle?
3. What single missing capability would prevent adoption?
4. What result or control made you trust or distrust the workflow?

## Decision record

Record participant role/experience, current-process minutes, Planora minutes, estimated manual minutes eliminated, completion status, severity of blockers and reuse intent. A pilot passes when the user completes the script without developer intervention, reconciliation is exact, and no critical security or financial-integrity concern is observed.
