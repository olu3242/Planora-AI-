# Wave 1 E2E certification

PASS: **39/39 Chromium tests**, zero retries, against the local production build using a freshly migrated/seeded schema of the isolated Wave 1 database. Evidence: `evidence/wave1/e2e.log`, screenshots under `evidence/wave1/browser/`.

Verified: login and route protection; cross-tenant direct-ID denial; exact actuals and lineage; Excel mapping/import/error handling; analyst → director → CFO forecast cycle; locked export reconciliation; admin authority boundary; keyboard/label checks; responsive widths 375, 430, 768, 1024, 1440; landing carousel playback/controls/reduced motion.

The first attempt could not start a dev server because an existing user dev server held the Next lock. It was left untouched. Certification then used the production build on dedicated loopback port 3021.

NOT CERTIFIED: the full PRD scenario → decision → action → outcome → reforecast journey, AP/AR settlement, bank matching, all nine agent journeys, accounting/report publication UI journeys, or external production integrations. Passing the supported 39 tests does not establish those missing journeys.
