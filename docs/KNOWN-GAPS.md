# Planora Known Gaps

## Active gaps

| ID | Gap | Severity | Effect | Required closure |
| --- | --- | --- | --- | --- |
| KG-005 | Human PR review/merge decision is still outstanding | Medium | PR can be review-ready but cannot be merged autonomously | Human review; merge only with explicit authorization |
| KG-007 | Private object storage and malware scanning are not certified | High | Blocks real customer financial workbooks and Production readiness | Implement/certify before any real-data pilot |
| KG-008 | Neon retention/PITR entitlement and a database restore rehearsal are not evidenced; exact RPO/RTO are `INSUFFICIENT_DATA` | High | Blocks real financial data and Production readiness | Obtain provider evidence and perform synthetic restore rehearsal |
| KG-009 | No real FP&A outcome evidence exists | High | Blocks `MVP_VALIDATED` and beta decisions | Run the controlled validation plan and record real evidence |
| KG-010 | Vercel logs/health exist, but alert delivery and measured SLOs are not configured | Medium | Acceptable only for facilitated synthetic validation with manual monitoring | Assign owner/check cadence; configure alerts before unattended/real-data use |

## Deferred by design

ERP/CRM integrations, Power BI, full budgeting, workforce/headcount, capex, treasury/cash, consolidation/intercompany, planning cubes, predictive forecasting, autonomous finance agents, generic workflow builders, advanced scenarios, board-book automation, billing, marketplace, mobile, complex SSO, and new personas are out of scope.

Product status remains `MVP_PARTIALLY_VALIDATED`. Report `INSUFFICIENT_DATA` instead of extrapolating missing pilot evidence.
