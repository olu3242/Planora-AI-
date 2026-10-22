import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const packages = lock.packages ?? {};
const monitored = ["braces", "micromatch", "fast-glob", "@next/eslint-plugin-next"];
let failed = false;

for (const name of monitored) {
  const path = `node_modules/${name}`;
  const entry = packages[path];
  if (!entry) {
    console.log(`PASS: ${name} is absent from the root lockfile graph`);
    continue;
  }
  if (entry.dev !== true || entry.optional === true && entry.devOptional !== true) {
    console.error(`FAIL: ${name}@${entry.version} is not exclusively marked as a development dependency (${path})`);
    failed = true;
  } else {
    console.log(`PASS: ${name}@${entry.version} is marked dev-only`);
  }
}

for (const [path, entry] of Object.entries(packages)) {
  if (!path || !entry || typeof entry !== "object") continue;
  if (entry.dev === true || entry.devOptional === true) continue;
  const dependencies = { ...entry.dependencies, ...entry.optionalDependencies };
  for (const name of monitored) {
    if (Object.hasOwn(dependencies, name)) {
      console.error(`FAIL: production-classified ${path} depends on monitored package ${name}`);
      failed = true;
    }
  }
}

assert.equal(failed, false, "A monitored development dependency entered the production dependency graph");
console.log("Production dependency boundary check passed; this does not replace npm audit.");
