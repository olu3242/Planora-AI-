# Planora G351–G360 — Bounded exact-SHA certification

Date: 2026-10-17. Release: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Status |
|---|---|---|
| G351 | Inspect commit b8a6de2 CI | certify in progress at inspection |
| G352 | Verify Accounting Integrity | PASS on b8a6de2 |
| G353 | Verify Merge Conflict Preflight | PASS on b8a6de2 |
| G354 | Verify independent security audit | FAIL; unresolved advisories |
| G355 | Review full certify pipeline | Database reset/seed, lint, typecheck, unit, integration, financial, Excel, security RLS, performance, browser E2E, build |
| G356 | Set full CI job time budget | 60-minute timeout |
| G357 | Set certify step time budget | 50-minute timeout |
| G358 | Capture exact-SHA certification timing | started_at and finished_at artifact |
| G359 | Preserve security audit as independent blocking job | Unchanged |
| G360 | Verify exact-SHA end-to-end outcome | Pending new workflow completion |

The timeout bounds CI consumption and provides evidence for prolonged or hung certification; it is not a waiver, skip or reduction of any test. RLS and E2E passing evidence is still missing. Security-audit failure remains a production NO-GO even if certify eventually passes. PR #7 stays draft, and no hosted migration, production deployment or merge occurred.
