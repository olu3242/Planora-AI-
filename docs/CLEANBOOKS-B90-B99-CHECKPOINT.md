# CleanBooks B90-B99: bounded cursor scan

Status: **SOURCE COMMITTED — NOT CERTIFIED**

- B90: bank transaction retrieval moved from a 500-row relation include to an explicit cursor loop.
- B91: stable transaction-id cursor ordering.
- B92: batches of up to 500, with one extra sentinel record to detect continuation.
- B93: bounded to 100 active bank accounts per scan (101st triggers a fail-closed error).
- B94: bounded to 20,000 fetched transactions per scan; incomplete accounts are flagged.
- B95-B99: unit acceptance scenarios for multi-page coverage, caps and incomplete readiness.

Important limitations:
1. Pagination is not snapshot-consistent across concurrent bank imports. A repeatable-read transaction or stable scan watermark is needed before financial certification.
2. The current scan is synchronous and cannot process over 20,000 rows; implement resumable jobs for larger books.
3. Role-level authorization, persistent kill switch, browser E2E and hosted tests are still outstanding.
4. The unit scenarios are authored but have not been executed in this session.
5. No posting or financial-record mutation is authorized.

Release decision: **NO-GO**.
