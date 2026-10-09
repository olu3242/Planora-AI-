# Planora global reporting foundation

Run `node --test reporting/engine.test.mjs` with Node 20+.

This isolated module provides sector/framework validation, a balanced trial-balance draft, entity isolation, and an approval-gated reporting agent. Framework entries are **eligibility routing examples, not compliance certifications**. Actual IFRS, FASB, GASB, FASAB, IPSAS, SME and local reporting require jurisdiction-specific policy packs, applicable standards research, chart-of-accounts classification, disclosure templates, reporting-period controls, consolidation and audit evidence.

Do not use this module as a production financial reporting system. The supplied approval callback must be wired to authenticated RBAC, segregation of duties and immutable evidence before any issuance. No hosted migrations or deployments are included.
