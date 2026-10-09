# Accounting posting risk register

Status: OPEN / NOT CERTIFIED

| Risk | Severity | Required resolution |
| --- | --- | --- |
| Trusted actor and tenant passed as arbitrary strings | Critical | Resolve server session and organization from authenticated request |
| Human approval is not verified from persisted evidence | Critical | Bind posting/reversal to approved decision and verify actor and scope |
| Database immutability SQL is not migrated or tested | Critical | Apply to disposable PostgreSQL and run direct SQL negative tests |
| Concurrent same-key posting may raise unique/serialization errors | High | Add bounded retries and verify exactly-one persistence |
| Account effective dates are checked against wall clock | High | Validate against fiscal-period transaction date |
| Reversal is restricted to the original fiscal period | Medium | Govern cross-period adjustments and closed-period corrections |
| Audit events lack structured approval evidence | High | Persist and verify approval reference and decision metadata |
| Existing reporting framework selection is not a compliance certification | High | Validate disclosures, rules, versions, and accountant signoff |

No production activation until critical risks are closed with evidence.
