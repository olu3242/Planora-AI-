# FR111–FR120 — Snapshot scope authorization

| Batch | Outcome |
|---|---|
| FR111 | Added transactional legal entity and fiscal calendar verifier |
| FR112 | Verified authenticated organization ID shape before queries |
| FR113 | Enforced legal entity ownership on snapshot reads |
| FR114 | Enforced fiscal calendar ownership on snapshot reads |
| FR115 | Applied same verifier to authenticated readiness API |
| FR116 | Applied verifier before immutable snapshot writes |
| FR117 | Updated repository mocks to include scope queries |
| FR118 | Added four transactional ownership regression tests |
| FR119 | Added tests to GitHub Actions readiness job |
| FR120 | Runtime PostgreSQL and full E2E certification still pending |

The authorization check must run inside the tenant transaction; it does not replace row-level security. The repository snapshot writer still assumes an already-authorized caller and must not be exposed directly as an untrusted API.

Open gates: run Prisma validation, typecheck, migrations, runtime-role RLS, actual accounting source checks, browser E2E, and full repository certification. Confirm whether the earlier migration was applied before editing history. Decision: PARTIAL / NO-GO.
