# G601-G610 — Confirmed forecast audit RLS failure and repair

Date: 2026-10-17. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Work | Result |
|---|---|---|
| G601 | Inspect exact-SHA G591-G600 CI 39088763498 | In progress at inspection |
| G602 | Inspect Accounting Integrity | PASS |
| G603 | Inspect Merge Conflict Preflight | PASS |
| G604 | Inspect completed previous CI 39088486222 | FAIL: one browser E2E |
| G605 | Trace browser page failure into server logs | Prisma auditEvent.findMany threw PostgreSQL 42501 |
| G606 | Identify forbidden relation | include.actor joined public.User |
| G607 | Verify restricted runtime role policy | public.User and public.Session access intentionally revoked |
| G608 | Remove unauthorized User relation include from forecast audit query | Committed |
| G609 | Render safe non-PII actor indicator from actorId | Committed |
| G610 | Re-run exact-SHA browser, accounting, RLS and dependency certification | Pending |

**Confirmed root cause:** the forecast page's audit history query included `actor: { select: { id, name, email } }`, which caused the restricted tenant connection to query `public.User`. PostgreSQL rejected that query with SQLSTATE 42501 and Next.js could not render the forecast page after an otherwise successful agent run. The fix removes the join and displays 'Authenticated actor' when actorId exists or 'System' otherwise. This deliberately reduces display detail instead of expanding runtime privileges or exposing user PII. An approved, separately authorized actor-label lookup can be designed later. The fix has not yet passed exact-SHA CI. Independent security audit remains a release blocker. No production migration, merge or deployment.
