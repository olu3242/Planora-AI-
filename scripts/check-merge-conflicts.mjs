import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const failures = [];
for (const file of files) {
  let contents;
  try { contents = readFileSync(file); } catch { continue; }
  if (contents.includes(0)) continue;
  if (/^(?:<{7}|>{7})(?:\s|$)/m.test(contents.toString("utf8"))) failures.push(file);
}
if (failures.length) {
  console.error(`Unresolved merge markers in:\n${failures.join("\n")}`);
  process.exitCode = 1;
} else console.log("Tracked files contain no unresolved merge markers.");
