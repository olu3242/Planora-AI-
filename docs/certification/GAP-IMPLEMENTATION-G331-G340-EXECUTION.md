# Planora G331–G340 — Runtime RLS connection verification

Date: 2026-10-17. Release: **NO-GO**.

| Batch | Scope | Result |
|---|---|---|
| G331 | Inspect exact-SHA CI 39042412333 | certify still in progress at inspection |
| G332 | Inspect accounting 39042412267 | in progress at inspection |
| G333 | Inspect preflight 39042412278 | conflict-preflight passed |
| G334 | Inspect independent security audit | failed: 5 high-severity advisories |
| G335 | Review RLS runtime declaration | restored and present |
| G336 | Review RLS isolation suite | tenant policies, cross-tenant CRUD, session revocation, concurrent rollback |
| G337 | Extend provisioning with runtime connection check | committed |
| G338 | Assert actual current_user and non-bypass role | committed |
| G339 | Assert Account readable, User and Session inaccessible | committed |
| G340 | Full exact-SHA security and E2E certification | pending; no passing claim |

The provisioning script now opens a second connection using the restricted runtime credentials and verifies the actual connected role and table privileges before security tests run. These checks must not be substituted for the seven tenant RLS test cases, and no green result is claimed until CI completes. Dependency audit remains a separate mandatory failing release gate. PR #7 stays draft; no production deployment or hosted migration.
