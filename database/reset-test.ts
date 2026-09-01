import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";

config();

const appEnvironment = process.env.APP_ENV ?? "development";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for the local test reset.");

const target = new URL(databaseUrl);
const localHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
if (!new Set(["development", "test"]).has(appEnvironment) || !localHosts.has(target.hostname)) {
  throw new Error(`Refusing destructive reset for APP_ENV=${appEnvironment} and database host ${target.hostname}. Only a loopback development/test database may be reset.`);
}

process.stdout.write(`Resetting approved local ${appEnvironment} database at ${target.hostname}:${target.port || "5432"}.\n`);

execFileSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "reset", "--force"], {
  stdio: "inherit",
  shell: false,
});
