import { ESLint } from "eslint";

const config = process.env.PLANORA_CANDIDATE_ESLINT_CONFIG ?? "eslint.config.mjs";
const eslint = new ESLint({ overrideConfigFile: config, overrideConfig: { linterOptions: { reportUnusedDisableDirectives: "off" } } });
const fixtures = [
  {
    name: "raw image",
    source: "export default function Page(){ return <img src='/x.png' alt='x' />; }",
    expected: ["@next/next/no-img-element"]
  },
  {
    name: "click without keyboard",
    source: "export default function Page(){ return <div onClick={() => {}}>Open</div>; }",
    expected: [process.env.PLANORA_CANDIDATE_ESLINT_CONFIG ? "jsx-a11y/click-events-have-key-events" : "planora/keyboard-interaction"]
  },
  {
    name: "hook in condition",
    source: "import { useState } from 'react'; export default function Page({enabled}: {enabled:boolean}) { if(enabled) useState(0); return null; }",
    expected: ["react-hooks/rules-of-hooks"]
  }
];
let failures = 0;
for (const fixture of fixtures) {
  const [result] = await eslint.lintText(fixture.source, { filePath: "app/__planora_lint_canary__.tsx" });
  const observed = new Set(result.messages.map(m => m.ruleId));
  const missing = fixture.expected.filter(rule => !observed.has(rule));
  console.log(JSON.stringify({ fixture: fixture.name, expected: fixture.expected, observed: [...observed], missing }));
  if (missing.length) failures++;
}
if (failures) {
  console.error(`Lint canaries failed: ${failures}`);
  process.exitCode = 1;
}
