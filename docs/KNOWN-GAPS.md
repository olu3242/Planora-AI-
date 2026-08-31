# Planora Known Gaps

## Active gaps

| ID | Description | Severity | Phase | Dependency | Blocker status | Resolution approach |
|---|---|---|---:|---|---|---|
| KG-001 | Phase 3-10 runtime workflows are not implemented | Critical | 3-10 | Certified Phase 2 | Dependency blocker for downstream certification | Implement sequential vertical slices |
| KG-003 | `index.html` is a static marketing artifact with dead product links | Medium | 1 | Authenticated runtime | Not blocked | Keep separate from real application shell |
| KG-005 | PR #1 is draft, unreviewed, and has no checks | High | 0 | Human review | Merge blocked | Keep dependent branch; do not merge |
| KG-006 | Preview/production infrastructure and credentials are unavailable | High | 10 | Infrastructure decision | HOSTED_BLOCKED | Select services and provision isolated environments |
| KG-007 | `planora-docs.zip` is an incomplete docs archive, not a release | Low | 0 | None | Not blocked | Exclude from release claims; generate only certified package later |
| KG-008 | Multi-currency edge cases, every workbook shape, and advanced statistical forecasting are deferred | Medium | 3/5 | MVP certified slice | Not blocked for MVP | Extend behind existing canonical/adapter boundaries |

## Current break point

The final Phase 0-10 E2E chain now passes `LOGIN -> TENANT -> RBAC -> CANONICAL FACT -> METRIC -> LINEAGE` and breaks at `EXCEL UPLOAD`, the Phase 3 boundary. This is not an external blocker to Phase 3 implementation.
