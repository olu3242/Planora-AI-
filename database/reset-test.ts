import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { requireIsolatedTestDatabaseUrl } from "../scripts/test-database-url";

if (process.env.APP_ENV !== "test") throw new Error("APP_ENV=test is required for the test database reset.");
const databaseUrl = requireIsolatedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
process.env.DATABASE_URL = databaseUrl;

const target = new URL(databaseUrl);
const databaseName = decodeURIComponent(target.pathname.replace(/^\//, ""));

process.stdout.write(`Resetting isolated test database ${target.hostname}/${databaseName}.\n`);

execFileSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "reset", "--force"], {
  stdio: "inherit",
  shell: false,
});
