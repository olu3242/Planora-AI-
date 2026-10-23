import { readFileSync } from "node:fs";
import { ESLint } from "eslint";

const baseline = process.env.PLANORA_BASELINE_ESLINT_CONFIG ?? "eslint.config.mjs";
const candidate = process.env.PLANORA_CANDIDATE_ESLINT_CONFIG;
if (!candidate) {
  console.error("PLANORA_CANDIDATE_ESLINT_CONFIG is required");
  process.exit(2);
}
const files = (process.env.PLANORA_ESLINT_PARITY_FILES ?? "app/page.tsx,src/app/page.tsx,pages/index.tsx")
  .split(",").map(value => value.trim()).filter(Boolean);
const severity = setting => {
  const value = Array.isArray(setting) ? setting[0] : setting;
  return value === "error" || value === 2 ? 2 : value === "warn" || value === 1 ? 1 : 0;
};

try {
  const inventoryPath = process.env.PLANORA_BASELINE_RULE_INVENTORY;
  const inventory = inventoryPath ? JSON.parse(readFileSync(inventoryPath, "utf8")) : null;
  const original = inventory ? null : new ESLint({ overrideConfigFile: baseline });
  const replacement = new ESLint({ overrideConfigFile: candidate });
  const results = [];
  let covered = 0;
  for (const file of files) {
    const base = inventory ? { rules: inventory[file] } : await original.calculateConfigForFile(file);
    const next = await replacement.calculateConfigForFile(file);
    if (!base?.rules || !next?.rules) {
      results.push({ file, error: "Missing baseline or candidate rules" });
      continue;
    }
    covered++;
    const weakened = Object.entries(base.rules)
      .filter(([, setting]) => severity(setting) > 0)
      .filter(([rule, setting]) => severity(next.rules[rule]) < severity(setting))
      .map(([rule, setting]) => ({ rule, baseline: severity(setting), candidate: severity(next.rules[rule]) }));
    results.push({ file, baselineRuleCount: Object.keys(base.rules).length, candidateRuleCount: Object.keys(next.rules).length, weakened });
  }
  console.log(JSON.stringify({ covered, expected: files.length, results }, null, 2));
  if (covered !== files.length || results.some(result => result.error || result.weakened?.length)) process.exitCode = 1;
} catch (error) {
  console.error(error);
  process.exitCode = 2;
}
