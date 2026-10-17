# Planora G291–G300 — Security RLS certification blocker

Date: 2026-10-17. Release: **NO-GO**.

| Batch | Evidence and action | Result |
|---|---|---|
| G291 | Inspect exact-SHA CI run 38846081904 | FAILED |
| G292 | Inspect merge preflight run 38846081960 | PASS |
| G293 | Inspect accounting integrity run 38846081891 | PASS |
| G294 | Inspect unit tests | 212/212 PASS |
| G295 | Inspect isolated integration tests | 11/11 files PASS |
| G296 | Inspect financial/Excel test stages | completed before security stage |
| G297 | Locate security failure | tests/security/tenant-rls.test.ts initialization |
| G298 | Identify missing runtime credential | TEST_RUNTIME_DATABASE_URL not supplied |
| G299 | Preserve fail-closed RLS test | explicitly forbid fallback to owner DATABASE_URL |
| G300 | RLS provisioning and full certification | BLOCKED; not claimed |

## Required fix
The RLS suite instantiates a second PrismaClient from TEST_RUNTIME_DATABASE_URL. CI currently provides only DATABASE_URL and TEST_DATABASE_URL, both using the owner role. To certify RLS, provision a **non-owner** PostgreSQL runtime role on the isolated local planora_test database, grant only required application table/schema privileges and EXECUTE on session-validation functions, then set TEST_RUNTIME_DATABASE_URL to that role's loopback connection. Confirm role has no SUPERUSER, BYPASSRLS, CREATEDB, CREATEROLE, ownership, or membership in owner role. Do not substitute owner credentials. Do not point this workflow at hosted databases.

Require the suite to prove all 56 tenant tables force RLS, unauthorized reads/writes are denied, session identity cannot be forged, session revocation works, and pooled concurrent transactions do not leak tenant context. The existing RLS test deliberately fails before execution when runtime credentials are absent.

## Other gate
Security audit remains FAILED (five high-severity findings in the braces chain). Keep security-audit mandatory and independent. No release, PR merge, migration, or deployment until both RLS and audit pass and full exact-SHA CI is green.
