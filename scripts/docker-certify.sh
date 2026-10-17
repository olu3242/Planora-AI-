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
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Docker Engine and Compose v2 are required." >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required for host-based certification." >&2
  exit 1
fi
if [[ "$(docker context show)" != "default" ]]; then
  echo "Non-default Docker context rejected for isolated local certification." >&2
  exit 1
fi
mkdir -p dist/certification-ci
on_exit() {
  result=$?
  docker compose -f compose.certification.yaml ps > dist/certification-ci/docker-ps.txt 2>&1 || true
  docker compose -f compose.certification.yaml logs --no-color postgres-cert > dist/certification-ci/docker-postgres.log 2>&1 || true
  printf 'exit_code=%s\\nfinished_at=%s\\n' "$result" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > dist/certification-ci/docker-run.txt
}
trap on_exit EXIT
printf 'started_at=%s\\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > dist/certification-ci/docker-start.txt
docker compose -f compose.certification.yaml config --quiet
docker compose -f compose.certification.yaml up -d --wait
npm ci
# Use the same authoritative certification sequence as GitHub Actions.
# This prevents Docker from silently skipping newly added release gates.
npx playwright install chromium
npm run certify
npm audit --audit-level=moderate
