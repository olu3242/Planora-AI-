# Wave 1 remaining gaps

1. P0: PostgreSQL connectivity recovered on a new isolated cluster; `.env.local` is development-only, and `.env.convergence.local` currently contains hosted credentials. Neither was mutated or used for test data. `.env.wave1.local` is the only explicit Wave 1 test configuration.
2. P0: all 61 application tables lack RLS. Application tenant predicates and database reference guards pass tested attacks, but this is not database policy isolation. Tenant context must be propagated within transactions and verified using a separate non-owner runtime role before enabling forced RLS; simply switching it on would break auth/bootstrap/workflows.
3. P0: critical/runtime dependency findings fixed, but five high findings remain through the dev-only ESLint → fast-glob → micromatch → braces chain. No fixed braces release was available at execution time. No audit suppression or unsafe framework downgrade performed.
4. P0: reporting, accounting and session branch adaptations exist locally and were exercised; semantic reconciliation is not complete. Local phase branches are ancestors. Unique-patch counts: reporting 17, accounting 8, session 6. Patch uniqueness is not missing-functionality proof.
5. Financial integrity: bank reconciliation previously summed all journal lines, necessarily zero for a balanced journal. The service now fails closed with BANK_LEDGER_MAPPING_REQUIRED. A persisted approved cash-ledger mapping, scoped account movement calculation, authorized matching and audit remain necessary.
6. AP/AR: existing persisted models, read views, aging and close controls are not full billing/settlement workflows.
7. Forecast MVP passes its narrower E2E. Full budgeting, driver planning, variance/root-cause/scenario/decision/action/outcome/reforecast chain remains incomplete.
8. Reporting framework routing does not establish accounting-standards compliance. Existing lifecycle integration passes; browser reporting publication and full framework manifests remain gaps.
9. All nine specified agents, dedicated treasury engine, live production integrations, and complete persona journeys are not certified.
10. Per-module coverage gate fails 14 of 15 boundaries. One configuration boundary passing code coverage does not pass its broader business acceptance.

Existing UI work, reconciliation matrix/PR draft, financial changes, and both recovery stashes remain preserved. No mock financial result is offered as evidence of a live integration.
