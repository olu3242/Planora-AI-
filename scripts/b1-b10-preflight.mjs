#!/usr/bin/env node
// Read-only Planora B1-B10 repository preflight. Never modifies financial data.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
const failures = [];
const checks = [];
function check(name, ok, detail) { checks.push({ name, status: ok ? "PASS" : "FAIL", detail }); if (!ok) failures.push(name); }
const required = ["package.json", "package-lock.json", "README.md", "AGENTS.md", ".github/workflows/ci.yml", "prisma/schema.prisma", "tests/setup.ts", "docs/IMPLEMENTATION-STATUS.md"];
for (const file of required) {
  if (!existsSync(file)) { check("exists:" + file, false, "missing"); continue; }
  const body = readFileSync(file, "utf8");
  check("merge-markers:" + file, !/^(<<<<<<< |=======\s*$|>>>>>>> )/m.test(body), "no unresolved Git conflict markers");
}
// Reject unresolved merge markers across tracked source, tests, migrations, and workflows.
try {
  const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
  const candidates = tracked.filter((file) => /\.(?:[cm]?[jt]sx?|json|jsonc|mjs|cjs|prisma|sql|ya?ml|md|css|scss|html)$/.test(file));
  const affected = [];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const body = readFileSync(file, "utf8");
    if (/^(<<<<<<< |=======\s*$|>>>>>>> )/m.test(body)) affected.push(file);
  }
  check("repository-wide-merge-markers", affected.length === 0, affected.length ? affected.join(", ") : `scanned ${candidates.length} tracked text files`);
} catch (error) {
  check("repository-wide-merge-markers", false, String(error.message));
}
try { JSON.parse(readFileSync("package.json", "utf8")); check("package-json", true, "valid JSON"); }
catch (error) { check("package-json", false, String(error.message)); }
try {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const root = lock.packages?.[""];
  const equal = (a, b) => JSON.stringify(Object.entries(a ?? {}).sort()) === JSON.stringify(Object.entries(b ?? {}).sort());
  check("lockfile-root-sync", Boolean(root && equal(pkg.dependencies, root.dependencies) && equal(pkg.devDependencies, root.devDependencies)), "package and lockfile root dependencies agree");
} catch (error) { check("lockfile-root-sync", false, String(error.message)); }
try { execFileSync("git", ["diff", "--check"], { stdio: "pipe" }); check("git-diff-check", true, "no whitespace errors"); }
catch { check("git-diff-check", false, "git diff --check failed"); }
const report = { scope: "B1-B10 preflight only; not an E2E certification", timestamp: new Date().toISOString(), checks, decision: failures.length ? "NO-GO" : "PREFLIGHT-PASS-NOT-CERTIFIED" };
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
process.exitCode = failures.length ? 1 : 0;
