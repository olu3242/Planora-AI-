# G421–G430 — Docker and CI certification parity

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Workstream | Result |
|---|---|---|
| G421 | Inspect G411–G420 exact-SHA CI | CI in progress at inspection |
| G422 | Verify merge-conflict preflight | PASS |
| G423 | Inspect independent security-audit job | FAIL |
| G424 | Inspect accounting-integrity run | In progress at inspection |
| G425 | Inspect Docker runtime availability | Not available in current execution container |
| G426 | Compare Docker runner to package.json certify script | Duplicate sequence could drift |
| G427 | Consolidate Docker tests onto npm run certify | Committed |
| G428 | Retain Chromium installation prerequisite | Preserved |
| G429 | Retain independent npm audit moderate-or-higher gate | Preserved |
| G430 | Update Docker documentation and verify full execution | Docs committed; full Docker run pending |

The Docker runner starts isolated PostgreSQL and invokes the same `npm run certify` command as GitHub Actions. This includes the tenant migration gate, restricted-role provisioning, RLS tests, accounting tests, browser E2E and build. It then runs `npm audit --audit-level=moderate`. This source change is **not** a successful Docker test run. The required `public.planora_session_tenant()` function and forced policies still need actual migrated database verification. No hosted migration, merge or deployment.
