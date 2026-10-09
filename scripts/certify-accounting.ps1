param(
  [switch]$ApplyTestMigration,
  [switch]$RunDatabaseTests
)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logDir = Join-Path $root "artifacts/accounting-certification/$stamp"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$results = [System.Collections.Generic.List[object]]::new()
function Run-Gate([string]$Name, [string]$Command) {
  Write-Host "==> $Name"
  $log = Join-Path $logDir ($Name + ".log")
  & cmd.exe /d /s /c "$Command" 2>&1 | Out-File -FilePath $log -Encoding utf8
  $exit = $LASTEXITCODE
  $results.Add([pscustomobject]@{ Gate=$Name; ExitCode=$exit; Log=$log })
  if ($exit -ne 0) { throw "Gate failed: $Name (exit $exit). See $log" }
}
try {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js not installed" }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm not installed" }
  Run-Gate "git-status" "git status --short"
  Run-Gate "npm-ci" "npm ci"
  Run-Gate "prisma-generate" "npx prisma generate"
  Run-Gate "prisma-validate" "npx prisma validate"
  Run-Gate "typecheck" "npm run typecheck"
  Run-Gate "lint" "npm run lint"
  Run-Gate "accounting-unit" "npx vitest run tests/unit/ai-native-accounting-controls.test.ts tests/unit/accounting-approval-policy.test.ts tests/unit/prisma-posting-adapter.test.ts tests/unit/posting-adapter-hardening.test.ts tests/unit/verified-session.test.ts"
  Run-Gate "all-unit" "npm run test:unit"
  if ($RunDatabaseTests) {
    if (-not $env:DATABASE_URL) { throw "DATABASE_URL must reference an isolated test database" }
    if ($env:DATABASE_URL -notmatch '(test|localhost|127\.0\.0\.1)') { throw "Refusing database commands: URL does not identify a test or local database" }
    if ($ApplyTestMigration) {
      Run-Gate "test-migration" "npx prisma migrate deploy"
    }
    Run-Gate "integration" "npm run test:integration"
    Run-Gate "security" "npm run test:security"
  }
  Write-Host "Completed selected gates. See $logDir"
} catch {
  Write-Error $_
  exit 1
} finally {
  $results | ConvertTo-Json -Depth 3 | Set-Content -Path (Join-Path $logDir "results.json") -Encoding utf8
}
