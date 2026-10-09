import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { requireIsolatedTestDatabaseUrl } from "./test-database-url";

if (process.env.APP_ENV !== "test") throw new Error("APP_ENV=test is required for test migrations.");
const databaseUrl = requireIsolatedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
process.env.DATABASE_URL = databaseUrl;

const target = new URL(databaseUrl);
const databaseName = decodeURIComponent(target.pathname.replace(/^\//, ""));
process.stdout.write(`Migration preflight accepted isolated test database ${target.hostname}/${databaseName}.\n`);

const prismaCli = resolve("node_modules/prisma/build/index.js");
const commands = process.argv[2] === "status" ? ["status"] : ["deploy", "status"];
for (const command of commands) {
  execFileSync(process.execPath, [prismaCli, "migrate", command], {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
}