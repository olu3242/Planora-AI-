# G661–G670 — React refs lint failure and exact-SHA certification

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Action | Result |
|---|---|---|
| G661 | Inspect previous exact-SHA CI 39092773986 | FAILED |
| G662 | Inspect failure stage | npm run lint |
| G663 | Identify merge scanner warning | Unused marker regex, fixed in G651–G660 |
| G664 | Identify React Hooks error | Cannot update restoreFocusRef.current during render |
| G665 | Inspect video dialog focus lifecycle | Focus restoration occurs during unmount cleanup |
| G666 | Move callback ref update into useEffect | Committed |
| G667 | Preserve callback dependency and modal cleanup | Preserved |
| G668 | Inspect latest preflight 39092864052 | PASS |
| G669 | Inspect latest Accounting Integrity and CI | In progress at inspection |
| G670 | Confirm new exact-SHA certification and security audit | Pending |

The React Hooks lint error is resolved at source level by moving the callback ref update out of render. This does not prove a passing lint run or browser E2E on the new SHA. Security audit still fails independently and must not be waived. No production migration, merge or deployment.
