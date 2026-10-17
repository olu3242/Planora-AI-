#!/usr/bin/env bash
set -euo pipefail
if [[ "${APP_ENV:-}" != "test" ]]; then
  echo "APP_ENV=test is mandatory" >&2; exit 1
fi
export DATABASE_URL="postgresql://planora_test:planora_docker_test_only@127.0.0.1:55433/planora_test?schema=public"
export TEST_DATABASE_URL="$DATABASE_URL"
export TEST_RUNTIME_DATABASE_URL="postgresql://planora_rls_runtime_test:planora_rls_docker_only@127.0.0.1:55433/planora_test?schema=public"
export RUNTIME_DATABASE_URL="$TEST_RUNTIME_DATABASE_URL"
export APP_URL="http://127.0.0.1:3000"
export SESSION_COOKIE_NAME="planora_session"
export SESSION_TTL_HOURS="12"
export PLAYWRIGHT_BASE_URL="http://127.0.0.1:3000"
docker compose -f compose.certification.yaml config --quiet
docker compose -f compose.certification.yaml up -d --wait
npm ci
npm run db:generate
npm run db:validate
npm run db:reset:test
npm run db:seed:test
npm run db:status:test
npx tsx scripts/check-tenant-session-function.ts
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:financial
npm run test:excel
npm run test:security
npm run test:performance
npm run db:reset:test
npm run db:seed:test
npx tsx scripts/provision-rls-runtime-test.ts
mkdir -p dist/certification-ci
npx tsx scripts/check-tenant-session-function.ts
npx playwright install chromium
npm run test:e2e
npm run build
npm audit --audit-level=moderate
