# Planora Known Gaps

## Active gaps

| ID | Description | Severity | Blocker status | Resolution |
|---|---|---|---|---|
| KG-005 | No PR/review/merge has been performed for the certification branch | Medium | Does not block local user validation | Open PR and require human review before merge |
| KG-006 | Preview/production infrastructure, private object storage, malware scanning, backups and monitoring are unconfigured | High | Blocks hosted external pilot, not local demo-data validation | Provision an isolated pilot environment under explicit authorization |
| KG-009 | No real FP&A baseline, observed session, feedback, reuse intent or commercial signal exists | High | Blocks `MVP_VALIDATED` and beta decisions | Run the validation kit and record evidence without inventing values |
| KG-010 | Hosted runtime/agent telemetry and operational alerting are not configured | Medium | Does not block isolated local user validation | Configure only with an explicitly authorized pilot environment |

## Deferred by design

ERP/CRM integrations, Power BI, workforce/headcount, capex, treasury/cash, consolidation/intercompany, full budgeting, planning cubes, predictive forecasting, autonomous finance agents, external-LLM dependency, generic workflow builders, advanced scenario engines, board-book automation, native mobile, complex SSO and marketplaces remain outside the Forecast MVP.

## Current boundary

The local Phase 20 workflow is `READY_FOR_USER_VALIDATION`. Phase 30 remains `MVP_PARTIALLY_VALIDATED` until real participants demonstrate usability, meaningful effort reduction, repeat intent and adoption/commercial evidence.
