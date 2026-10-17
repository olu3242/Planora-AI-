# Planora G311–G320 — Tenant RLS compilation repair and role hardening

Date: 2026-10-17. Release: **NO-GO**.

| Batch | Action | Observed result |
|---|---|---|
| G311 | Inspect exact-SHA CI run 39039350029 | CI certify failed |
| G312 | Inspect accounting integrity run 39039350032 | Initially in progress; no pass claimed |
| G313 | Inspect preflight run 39039350271 | Conflict-preflight passed |
| G314 | Inspect security-audit job | Failed; advisory gate remains blocking |
| G315 | Inspect certify logs | TypeScript TS2304 on undefined runtime and dependent errors |
| G316 | Trace root cause | Literal backslash-n in comment commented out PrismaClient declaration |
| G317 | Repair RLS test declaration | Committed real newline; no assertion weakened |
| G318 | Review RLS runtime provisioning | Dedicated loopback *_test runtime required |
| G319 | Harden role provisioning | Validated DB name; deny table ownership and owner-role membership |
| G320 | Exact-SHA RLS and full certification | Pending new GitHub Actions result |

The TS2304 compile errors prevented the newly provisioned RLS role from being evaluated. The code repair restores compilation intent, not proof of a successful run. No role provisioning against hosted or production databases, migration, PR merge or deployment occurred. The security-audit job continues to fail and remains a mandatory release gate.
