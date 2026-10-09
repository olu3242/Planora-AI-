# Agent Memory Governance

## Purpose
Planora financial memory is governed decision context, not unrestricted conversational memory.

## E2E flow
Financial evidence → agent recommendation → domain-authorized independent human review → ACCEPT / EDIT / REJECT → feedback evidence → memory admission → later scoped agent recall.

## Admission
Only ACCEPTED and EDITED recommendations are eligible for recall. PENDING and REJECTED recommendations are excluded. Agent output does not become memory merely because an agent produced it.

## Scope
Memory is tenant scoped and can be narrowed by legal entity, fiscal period, account, decision type, and decision time. Retrieval keeps the latest accepted decision for the same decision/scope key to reduce stale superseded context.

## Provenance
Agent runs record recalled recommendation IDs. Management insight recommendations carry source recommendation IDs and memory recommendation IDs so reviewers can determine what evidence and institutional decisions influenced the recommendation.

## Authority
- COA_MAPPING_REVIEW → accounting.recommendation.review
- FINANCIAL_STATEMENT_REVIEW → accounting.recommendation.review
- ACCOUNTING_CLOSE_READINESS → accounting.recommendation.review
- FORECAST_REFRESH_REVIEW → fpanda.recommendation.review
- MANAGEMENT_INSIGHT_REVIEW → management.insight.review
- period close approval → accounting.close.approve

Unknown recommendation types fail closed.

## Segregation of duties
Recommendation actors cannot decide their own recommendations. Close workflow requesters cannot approve their own close.

## Financial authority
Memory may influence recommendations but never grants posting, payment, close, COA-write, forecast-publish, or other financial mutation authority. Those remain separately permissioned and human governed.

## Certification
Unit coverage exists for domain recommendation authority and memory admission invariants. Full Prisma/typecheck/integration/security/build/browser certification remains required before release classification.
