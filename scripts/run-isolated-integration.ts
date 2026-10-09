import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { requireIsolatedTestDatabaseUrl } from "./test-database-url";

// Integration files mutate and lock financial fixtures. Never share their database
// state. Each file gets a fresh schema; never reset or drop an existing schema.
if (process.env.APP_ENV !== "test") throw new Error("APP_ENV=test is required for isolated integration certification.");
const databaseUrl = requireIsolatedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const files = readdirSync("tests/integration").filter(name => name.endsWith(".test.ts")).sort();
let failed = 0;
for (const file of files) {
  process.stdout.write(`\nIsolated integration fixture: ${file}\n`);
  const target = new URL(databaseUrl);
  target.searchParams.set("schema", `cert_${randomUUID().replaceAll("-", "")}`);
  process.env.TEST_DATABASE_URL = target.toString();
  process.env.DATABASE_URL = target.toString();
  execFileSync(process.execPath, ["--import", "tsx", "scripts/migrate-test.ts"], { stdio: "inherit", env: process.env });
  execFileSync(process.execPath, ["--import", "tsx", "scripts/seed-test.ts"], { stdio: "inherit", env: process.env });
  try {
    const coverage = process.env.PLANORA_COVERAGE === "1" ? ["--coverage", "--coverage.reporter=json", "--coverage.reporter=json-summary", `--coverage.reportsDirectory=coverage/wave1-integration/${file}`, "--coverage.include=src/**"] : [];
    execFileSync(process.execPath, [resolve("node_modules/vitest/vitest.mjs"), "run", `tests/integration/${file}`, ...coverage], { stdio: "inherit", env: process.env });
  } catch {
    failed++;
  }
}
process.stdout.write(`\nIntegration files: ${files.length - failed} passed, ${failed} failed.\n`);
process.exitCode = failed ? 1 : 0;
