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
# Use the same authoritative certification sequence as GitHub Actions.
# This prevents Docker from silently skipping newly added release gates.
npx playwright install chromium
npm run certify
npm audit --audit-level=moderate
