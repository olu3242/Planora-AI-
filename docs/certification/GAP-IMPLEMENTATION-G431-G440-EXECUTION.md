# G431–G440 — Docker failure evidence and safe local execution

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Scope | Result |
|---|---|---|
| G431 | Inspect G421–G430 exact-SHA CI | Full certify still in progress |
| G432 | Verify merge-conflict preflight | PASS |
| G433 | Inspect independent security audit | FAILED |
| G434 | Review authoritative Prisma reset and migration entrypoints | Uses isolated guarded test URL |
| G435 | Review tenant-session runtime SQL | Calls planora_session_tenant(); no bypass introduced |
| G436 | Add Docker and npm prerequisite guards | Committed |
| G437 | Restrict Docker runner to default context | Committed; local engine still must be verified |
| G438 | Capture PostgreSQL logs and Compose status on exit | Committed |
| G439 | Capture Docker start/finish/exit code evidence | Committed |
| G440 | Run Docker suite and repair migration | Not executed; Docker daemon unavailable in this environment |

The runner invokes the canonical npm certify pipeline against the isolated loopback PostgreSQL test database. No passing RLS, E2E or Docker result is claimed. Before a migration change, inspect the actual database catalog and authoritative migration SQL to determine why public.planora_session_tenant() is absent. Security audit remains mandatory and failing. No production migration, PR merge or deployment.
