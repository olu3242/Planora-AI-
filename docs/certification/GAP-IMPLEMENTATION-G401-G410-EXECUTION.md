# G401–G410 — Unified Docker and CI tenant migration gate

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Scope | Result |
|---|---|---|
| G401 | Inspect exact-SHA workflow for e0c85529 | Accounting Integrity PASS |
| G402 | Inspect conflict preflight | PASS |
| G403 | Inspect independent security audit | FAIL |
| G404 | Inspect full certify job | In progress at inspection |
| G405 | Check execution environment Docker availability | Docker daemon unavailable in assistant container |
| G406 | Expose test:tenant-migration npm script | Committed |
| G407 | Require migration gate in npm run certify | Committed after reset/seed/status |
| G408 | Reuse same migration gate in Docker runner | Committed for both database resets |
| G409 | Assert Account table forced RLS | Committed alongside exact tenant-session function check |
| G410 | Full Docker certification and migration repair | Not executed; requires accessible Docker runtime and migration evidence |

The shared test:tenant-migration script checks for exact public.planora_session_tenant() and forced Account RLS in an isolated loopback *_test database. It is a fail-closed prerequisite, not a migration implementation or proof that all tenant RLS policies work. The security-audit job still fails. Do not use owner-role runtime access, invent a session-validation function, suppress audit findings, merge draft PR #7, or deploy.

Execute from checked-out branch: `APP_ENV=test bash scripts/docker-certify.sh`. Preserve logs from the first failure and inspect authoritative Prisma migrations before making a function implementation change.
