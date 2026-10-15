# CleanBooks B80-B89 checkpoint
Status: NOT CERTIFIED.

B80: Vitest CLI filter corrected to discover tests by path substring.
B81: Legal entity query requires active=true.
B82: Bank dates require a valid Date instance.
B83: Transaction fingerprint tolerates missing descriptions.
B84: Read-only scan fetches 501 records, exposes only first 500 and treats the extra row as a truncation sentinel.
B85-B89: Regression scenarios added for exact-limit coverage, overflow sentinel, malformed dates, unsafe amounts and malformed descriptions.

Known gaps: scan still does not paginate past 500; no controller-role authorization, persisted kill switch, browser E2E, or hosted certification. No tests have been executed by this GitHub-only session. No financial posting is performed.
