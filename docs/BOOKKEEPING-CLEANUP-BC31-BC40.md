# BC31–BC40 — Independent execution verification boundary

| Batch | Result |
|---|---|
| BC31 | Defined accounting operation receipt shape |
| BC32 | Bound receipts to organization |
| BC33 | Bound receipts to legal entity and fiscal period |
| BC34 | Bound receipts to cleanup case ID |
| BC35 | Required successful accounting operation |
| BC36 | Required independent verification actor and source revision |
| BC37 | Required EXECUTION_PENDING state |
| BC38 | Applied existing revision-fenced VERIFY transition |
| BC39 | Added five receipt-gate unit tests |
| BC40 | Registered regression tests in CI; execution not observed |

## Certification boundary
The receipt is a typed input contract, NOT independently authenticated evidence. The current verifier trusts the receipt supplied by a server-side caller. Do not expose it as an API accepting client receipts. Before production, implement a trusted adapter that reads accounting execution records from the ledger/reconciliation service, verifies transaction ownership, actual posting or reconciliation, immutable operation identity and source revision, and persists the receipt in a transaction with the case transition.

Not implemented: actual posting/reversal, verified bank matching, persisted receipt linkage, automatic readiness recalculation, background execution, runtime role-based PostgreSQL RLS, and full E2E. NO-GO.
