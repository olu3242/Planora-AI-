#!/usr/bin/env node
// Read-only Planora B1-B10 repository preflight. Never modifies financial data.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
const failures = [];
const checks = [];
function check(name, ok, detail) { checks.push({ name, status: ok ? "PASS" : "FAIL", detail }); if (!ok) failures.push(name); }
const required = ["package.json", "README.md", "AGENTS.md", "docs/IMPLEMENTATION-STATUS.md"];
for (const file of required) {
  if (!existsSync(file)) { check("exists:" + file, false, "missing"); continue; }
  const body = readFileSync(file, "utf8");
  check("merge-markers:" + file, !/^(<<<<<<< |=======\s*$|>>>>>>> )/m.test(body), "no unresolved Git conflict markers");
}
try { JSON.parse(readFileSync("package.json", "utf8")); check("package-json", true, "valid JSON"); }
catch (error) { check("package-json", false, String(error.message)); }
try { execFileSync("git", ["diff", "--check"], { stdio: "pipe" }); check("git-diff-check", true, "no whitespace errors"); }
catch { check("git-diff-check", false, "git diff --check failed"); }
const report = { scope: "B1-B10 preflight only; not an E2E certification", timestamp: new Date().toISOString(), checks, decision: failures.length ? "NO-GO" : "PREFLIGHT-PASS-NOT-CERTIFIED" };
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
process.exitCode = failures.length ? 1 : 0;
