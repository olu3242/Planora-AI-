# Hosted Security Certification

Candidate SHA: `fdb419ee28fba0025a4f081b295e011393cc920f`

Preview deployment: `dpl_GukiqTLY4S1RFuzgRUu82U9wrc3B`

## Implemented and locally certified

- unauthenticated API returns 401 and protected page redirects to login;
- Analyst export, Director approval, and CFO lock escalation attempts return 403;
- Director CFO-lock escalation returns 403;
- Platform Admin has no financial read/write/submit/approve/lock authority;
- Org A direct access to Org B organization, account, fact, metric, forecast, export, workbook, import, mapping, commentary, recommendation, feedback, and runtime objects fails closed;
- foreign form mutations redirect only to a generic error and leave the foreign record count unchanged;
- non-addressable import-batch, commentary, audit-event, and export-ID route guesses return 404;
- locked-version mutations are rejected by application guards and database triggers.

The local security suite passed 10/10 and the zero-retry browser suite passed 35/35 at the candidate SHA. Removing the Excel segment loading boundary corrected a Next.js streamed-not-found edge case so a foreign workbook page now returns a real HTTP 404 rather than a streamed 200 containing not-found UI.

## Hosted status

`PASS`. The authorized hosted suite exercised unauthenticated denial, login/session boundaries, cross-tenant direct-object attempts, Analyst/Director/CFO role limits, Platform Admin financial-authority denial, foreign mutation non-occurrence, and locked-state enforcement against the exact Preview. All 35 hosted browser tests passed with one worker and zero retries; the post-run error-level deployment log query returned no entries. No frontend-only authorization claim is counted.
