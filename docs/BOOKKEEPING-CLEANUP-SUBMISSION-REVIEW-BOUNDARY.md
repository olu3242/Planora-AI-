# Submission and review access boundary

A user with `financial.import` can submit cleanup proposals without being granted `accounting.recommendation.review`. A user with the latter permission may review findings in the tenant-scoped review queue. The submission form no longer redirects an import-only user to a reviewer-only page.

Cleanup results are proposals only; no accounting posting or source-row deletion occurs. Request keys are stable across retries. An HTTP 409 indicates the key was reused for a different batch or input and requires a new request.

This access boundary is implemented in source but still needs a dedicated authenticated browser test and verified CI before release.
