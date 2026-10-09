# Preview Rollback Rehearsal

Candidate SHA: `fdb419ee28fba0025a4f081b295e011393cc920f`

Current deployment: `dpl_GukiqTLY4S1RFuzgRUu82U9wrc3B`

Prior known-good deployment: `dpl_HuwqwzfnVtZebsqPcmMUqx4KALAV`

Disposable alias: `https://planora-pilot-rollback-rehearsal-eduradiusllc.vercel.app`

Executed: 2026-09-01

Production changed: NO

## Rehearsal

1. Pointed the disposable Preview-only alias to the prior known-good deployment.
2. Verified `/api/health` returned `{"status":"healthy"}`, proving runtime and database connectivity.
3. Repointed the same disposable alias to the current exact candidate.
4. Verified `/api/health` returned `{"status":"healthy"}` again.

Result: PASS for Preview routing recovery. Data impact: none; both deployments use the same isolated synthetic Preview database and no schema rollback or data mutation occurred.

Vercel's `rollback` command is a Production routing operation, so it was intentionally not used. A production rollback remains prohibited without explicit authorization. For a bad Preview, use the immutable prior Preview URL or a disposable/test alias, investigate, fix forward, and let the Git branch create a new Preview. Database changes require a reviewed compensating migration; do not reverse an applied migration blindly.
