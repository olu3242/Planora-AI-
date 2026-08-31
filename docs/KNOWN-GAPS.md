# Planora Known Gaps

## Active gaps

| ID | Description | Severity | Phase | Dependency | Blocker status | Resolution approach |
|---|---|---|---:|---|---|---|
| KG-001 | Phase 2-10 runtime financial workflows are not implemented | Critical | 2-10 | Certified Phase 1 | Dependency blocker for downstream certification | Implement sequential vertical slices |
| KG-003 | `index.html` is a static marketing artifact with dead product links | Medium | 1 | Authenticated runtime | Not blocked | Keep separate from real application shell |
| KG-005 | PR #1 is draft, unreviewed, and has no checks | High | 0 | Human review | Merge blocked | Keep dependent branch; do not merge |
| KG-006 | Preview/production infrastructure and credentials are unavailable | High | 10 | Infrastructure decision | HOSTED_BLOCKED | Select services and provision isolated environments |
| KG-007 | `planora-docs.zip` is an incomplete docs archive, not a release | Low | 0 | None | Not blocked | Exclude from release claims; generate only certified package later |
| KG-008 | Multi-currency edge cases, every workbook shape, and advanced statistical forecasting are deferred | Medium | 3/5 | MVP certified slice | Not blocked for MVP | Extend behind existing canonical/adapter boundaries |

## Current break point

The final Phase 0-10 E2E chain now passes `LOGIN -> TENANT -> RBAC` and breaks at `EXCEL UPLOAD`, which is Phase 3 and depends first on the Phase 2 canonical financial engine. This is not an external blocker to Phase 2 implementation.
