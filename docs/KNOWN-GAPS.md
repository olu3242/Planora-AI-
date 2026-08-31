# Planora Known Gaps

## Active gaps

| ID | Description | Severity | Phase | Dependency | Blocker status | Resolution approach |
|---|---|---|---:|---|---|---|
| KG-001 | Phase 1-10 runtime functionality was absent at the Phase 0 baseline | Critical | 1-10 | Phase 0 | Dependency blocker for certification | Implement sequential vertical slices |
| KG-002 | No schema, migration, seed, source, tests, fixture, CI, or evidence existed | Critical | 1 | Phase 0 | Not blocked locally | Establish foundation runtime and gate |
| KG-003 | `index.html` is a static marketing artifact with dead product links | Medium | 1 | Authenticated runtime | Not blocked | Keep separate from real application shell |
| KG-004 | Baseline package scripts were aspirational and unverified | High | 1 | Runtime/configuration | Not blocked | Wire scripts and execute every gate |
| KG-005 | PR #1 is draft, unreviewed, and has no checks | High | 0 | Human review | Merge blocked | Keep dependent branch; do not merge |
| KG-006 | Preview/production infrastructure and credentials are unavailable | High | 10 | Infrastructure decision | HOSTED_BLOCKED | Select services and provision isolated environments |
| KG-007 | `planora-docs.zip` is an incomplete docs archive, not a release | Low | 0 | None | Not blocked | Exclude from release claims; generate only certified package later |
| KG-008 | Multi-currency edge cases, every workbook shape, and advanced statistical forecasting are deferred | Medium | 3/5 | MVP certified slice | Not blocked for MVP | Extend behind existing canonical/adapter boundaries |

## Current break point

The final E2E chain breaks at `LOGIN`: no application/authentication runtime exists yet. Every downstream stage is dependency-blocked for certification, not externally blocked for implementation.
