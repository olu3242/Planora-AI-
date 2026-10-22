import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const runner = new URL("../../scripts/check-public-experience.mjs", import.meta.url);

function runGuard(experience, landing) {
  const dir = mkdtempSync(join(tmpdir(), "planora-public-guard-"));
  try {
    mkdirSync(join(dir, "scripts"));
    mkdirSync(join(dir, "src/app/experience"), { recursive: true });
    mkdirSync(join(dir, "src/components/showcase"), { recursive: true });
    for (const file of ["src/app/page.tsx", "src/components/showcase/content.ts", "src/components/showcase/dashboard-showcase.tsx", "src/components/showcase/video-showcase.tsx", "src/components/showcase/feature-carousel.tsx", "src/components/showcase/customer-showcase.tsx"]) writeFileSync(join(dir, file), "");
    copyFileSync(runner, join(dir, "scripts/check-public-experience.mjs"));
    writeFileSync(join(dir, "src/app/experience/page.tsx"), experience);
    writeFileSync(join(dir, "src/components/approved-landing.tsx"), landing);
    return spawnSync(process.execPath, ["scripts/check-public-experience.mjs"], { cwd: dir, encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("allows non-sensitive illustrative marketing content", () => {
  const result = runGuard('const title = "Illustrative finance dashboard";', 'const tagline = "Planora";');
  assert.equal(result.status, 0, result.stderr);
});

test("rejects private IP addresses", () => {
  const result = runGuard('const endpoint = "192.168.1.10";', "");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /private IPv4 address/);
});

test("rejects internal hostnames", () => {
  const result = runGuard('const host = "database.internal";', "");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /internal hostname/);
});

test("rejects hardcoded credential assignments", () => {
  const result = runGuard('const api_key = "placeholder-secret-value";', "");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /hardcoded credential assignment/);
});

test("rejects private key material", () => {
  const result = runGuard('const text = "-----BEGIN PRIVATE KEY-----";', "");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /private key material/);
});
