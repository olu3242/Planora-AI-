# G391–G400 — Docker migration diagnostics

Date: 2026-10-17. Release: **NO-GO / NOT CERTIFIED**.

| Batch | Scope | Result |
|---|---|---|
| G391 | Review Docker-backed PostgreSQL certification runner | Completed |
| G392 | Review tenant database session function call | Confirmed no-argument planora_session_tenant() required |
| G393 | Review isolated migration/reset sequence | Completed |
| G394 | Add isolated tenant-session function diagnostic | Committed |
| G395 | Inspect pg_proc and pg_namespace for signature/schema | Implemented |
| G396 | Reject missing public zero-argument function | Fail-closed |
| G397 | Run diagnostic after first reset/seed | Configured |
| G398 | Run diagnostic after second reset/seed | Configured |
| G399 | Update Docker troubleshooting documentation | Committed |
| G400 | Execute Docker certification and repair canonical migration | Not executed; requires Docker runner and migration evidence |

Run `APP_ENV=test bash scripts/docker-certify.sh` on a checkout with Docker Compose v2, Node 24 and Chromium dependencies. The script resets only the isolated loopback planora_test database. Missing `public.planora_session_tenant()` is an unresolved migration blocker; do not invent its semantics or stub it. A real fix requires reviewing authoritative migrations and ensuring RLS validates authenticated sessions, membership and expiry.

Security audit remains a separate mandatory release gate; prior audit reported five high-severity advisories. PR #7 remains draft, and no production migration, deployment or merge occurred.
