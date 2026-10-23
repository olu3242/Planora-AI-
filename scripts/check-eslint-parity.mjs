import { ESLint } from "eslint";

const baseline = process.env.PLANORA_BASELINE_ESLINT_CONFIG ?? "eslint.config.mjs";
const candidate = process.env.PLANORA_CANDIDATE_ESLINT_CONFIG;
if (!candidate) {
  console.error("Set PLANORA_CANDIDATE_ESLINT_CONFIG to the reviewed candidate configuration path.");
  process.exit(2);
}
const representative = (process.env.PLANORA_ESLINT_PARITY_FILES ?? "app/page.tsx,src/app/page.tsx,pages/index.tsx").split(",").map(x => x.trim()).filter(Boolean);
async function loadRules(configFile) {
  const engine = new ESLint({ overrideConfigFile: configFile });
  for (const file of representative) {
    const config = await engine.calculateConfigForFile(file);
    if (config?.rules && Object.keys(config.rules).length) return config.rules;
  }
  throw new Error("No ESLint configuration resolved for representative Next.js files");
}
const severity = (rule) => {
  const v = Array.isArray(rule) ? rule[0] : rule;
  return v === "error" || v === 2 ? 2 : v === "warn" || v === 1 ? 1 : 0;
};
try {
  const original = await loadRules(baseline);
  const replacement = await loadRules(candidate);
  const regressions = Object.entries(original)
    .filter(([, value]) => severity(value) > 0)
    .filter(([name, value]) => severity(replacement[name]) < severity(value))
    .map(([name, value]) => ({
      rule: name,
      baseline: severity(value),
      candidate: severity(replacement[name])
    }));
  const summary = {
    baselineRuleCount: Object.keys(original).length,
    candidateRuleCount: Object.keys(replacement).length,
    weakenedOrMissingRules: regressions
  };
  console.log(JSON.stringify(summary, null, 2));
  if (regressions.length) process.exitCode = 1;
} catch (error) {
  console.error(error);
  process.exitCode = 2;
}
