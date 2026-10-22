#!/usr/bin/env node
// Read-only preflight: detect unresolved merge markers in dependency manifests.
// Never auto-select HEAD/theirs: lockfile and manifest must be reconciled together.
import { readFileSync } from "node:fs";
const targets = ["package.json", "package-lock.json"];
let failed = false;
for (const path of targets) {
  const contents = readFileSync(path, "utf8");
  const lines = contents.split(/\r?\n/);
  const markers = lines.flatMap((line, index) =>
    /^(?:<{7}|={7}|>{7})(?:\s|$)/.test(line) ? [index + 1] : []
  );
  if (markers.length) {
    failed = true;
    console.error(`${path}: unresolved merge markers at ${markers.length} lines (first: ${markers.slice(0, 8).join(", ")})`);
    continue;
  }
  try {
    JSON.parse(contents);
    console.log(`${path}: JSON syntax valid and no merge markers`);
  } catch (error) {
    failed = true;
    console.error(`${path}: invalid JSON: ${error.message}`);
  }
}
if (failed) {
  console.error("BLOCKED: reconcile manifest and lockfile together, then run npm ci and build checks. No automatic dependency selection was performed.");
  process.exitCode = 1;
}
