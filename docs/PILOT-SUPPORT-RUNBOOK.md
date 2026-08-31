# Controlled Pilot Support Runbook

## Provision and reset

Use the isolated `PLANORA-DEMO` organization and its Analyst, FP&A Director, and CFO seed accounts with non-sensitive fixtures only. Apply migrations and seed from a clean pilot database. For a repeatable local reset, run `npm run db:reset:test` followed by `npm run db:seed`. This is destructive and must never target a database containing retained pilot data.

For removal, delete the isolated pilot environment/database according to the hosting retention policy. Do not manually delete tenant rows from a shared production database. Hosted provisioning/removal requires an approved environment target and backup/retention plan.

## Diagnose safely

Ask for timestamp, user role, route, opaque forecast/workbook ID, visible error code, and correlation ID. Do not request workbook contents or financial values in support channels. Server errors return correlation IDs and unhandled errors log the correlation ID without request payloads.

## Common issues

| Symptom | Check | Recovery |
|---|---|---|
| Cannot sign in | account active, role membership, throttle window, cookie policy | wait for throttle window or reset the demo account through the controlled seed process |
| Upload rejected | extension/MIME, 5 MB size, archive expansion/complexity limits | use the provided `.xlsx`/`.csv` fixture or reduce the source to the MVP contract |
| Mapping blocked | required fields, duplicate target concepts, unresolved accounts, header drift | correct the mapping/source; never bypass review in the database |
| Validation blocked | persisted row, code, severity, reason and guidance | correct source and upload a new file; do not edit canonical facts |
| Wrong workflow action | current status and role | reload, then use only the outstanding server-authorized action |
| Export denied | Director/CFO role and approved/locked state | complete approval first; do not grant broad read users export permission |
| Locked edit rejected | forecast state/audit | create a new governed cycle/version; never unlock by direct database mutation |
| Server failure | health endpoint, correlation ID, sanitized server log | preserve data, retry only idempotent upload/read operations, escalate with correlation ID |

## Operational checks

Verify `/api/health`, database connectivity, migration head, secure session settings, file limits, recent `IMPORT.VALIDATION_FAILED`/workflow audit events, response time, disk/storage capacity, and error logs. Logs and tickets must exclude workbook bodies, commentary bodies, and financial line values unless an explicitly approved secure diagnostic process is used.

## Escalation

Immediately stop the pilot for suspected tenant leakage, unauthorized approval/lock, unreconciled export, silent financial modification, or lost audit history. Usability questions and recoverable validation errors do not require shutdown but should be recorded in the pilot evidence record.
