# Bookkeeping Cleanup BC21–BC30 — authenticated review boundary

| Batch | Scope | Result |
|---|---|---|
| BC21 | Server-derived cleanup role mapping | Committed |
| BC22 | Deny PLATFORM_ADMIN finance cleanup | Committed |
| BC23 | Validate revision/evidence/proposal payloads | Committed |
| BC24 | Disallow client direct execution/verification | Committed |
| BC25 | Authenticated cleanup work queue GET | Committed |
| BC26 | Transactional tenant/entity/period filtering | Committed |
| BC27 | Authenticated review transition POST | Committed |
| BC28 | CFO-only controller approval | Committed |
| BC29 | Four authorization unit tests | Written, unexecuted |
| BC30 | CI triggers and regression suite | Configured, unverified |

## Boundaries and blockers
The API supports human review transitions only. It deliberately does NOT expose QUEUE_EXECUTION or VERIFY because those require trusted service-side accounting execution and independent receipts. No correction, reversal, matching, posting, or readiness recalculation is implemented in this wave.

The organization role mapping is a temporary authorization bridge, not a separate Bookkeeper/Accountant/Controller role model. Review role requirements before production. Validate CSRF/origin protections for cookie-authenticated POST, verify tenant isolation with non-BYPASSRLS PostgreSQL runtime role, and execute TypeScript/Prisma/unit/API/browser tests. Ensure cleanup case ID encoding works through Next.js route parameters. Run tests before release.

Certification: NO-GO.
