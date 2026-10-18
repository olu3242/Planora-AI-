#!/usr/bin/env node
// Static guard for public marketing content. This is defense in depth, not a secret scan of the repository.
import { readFileSync } from "node:fs";
const files = ["src/app/experience/page.tsx", "src/components/brand-landing.tsx"];
const violations = [];
for (const file of files) {
  const source = readFileSync(file, "utf8");
  const checks = [
    ["private IPv4 address", /\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.)\d{1,3})\b/g],
    ["private key material", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
    ["hardcoded credential assignment", /(?:api[_-]?key|client[_-]?secret|private[_-]?key)\s*[:=]\s*["'`][^"'`\n]{8,}["'`]/gi],
    ["internal hostname", /\b[a-z0-9-]+\.(?:internal|corp|localdomain)\b/gi]
  ];
  for (const [name, pattern] of checks) if (pattern.test(source)) violations.push(file + ": " + name);
}
if (violations.length) {
  console.error("Public marketing static guard failed:\n" + violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Public marketing static guard passed for " + files.length + " files (limited scope).");
}
