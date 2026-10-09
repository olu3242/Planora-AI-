import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parse } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { requireIsolatedTestDatabaseUrl } from "./test-database-url";

// Explicit test configuration only; never fall back to ambient or hosted URLs.
const config = parse(readFileSync(".env.wave1.local"));
const url = requireIsolatedTestDatabaseUrl(config.TEST_DATABASE_URL);
if (config.APP_ENV !== "test" || config.DATABASE_URL !== url) throw new Error("Wave 1 requires matching explicit test URLs and APP_ENV=test");
const target = new URL(url);
if (target.port !== "55440" || target.pathname !== "/planora_wave1_test") throw new Error("Unexpected Wave 1 test target");
if (process.env.WAVE1_SCHEMA) {
  if (!/^cert_[a-f0-9]{32}$/.test(process.env.WAVE1_SCHEMA)) throw new Error("Invalid isolated schema name");
  target.searchParams.set("schema", process.env.WAVE1_SCHEMA);
  config.DATABASE_URL = target.toString();
  config.TEST_DATABASE_URL = target.toString();
}
Object.assign(process.env, config);
const db = new PrismaClient({ datasourceUrl: url });
try {
  const identity = await db.$queryRaw<Array<{ database: string; role: string; port: number; superuser: boolean; bypass: boolean }>>`
    SELECT current_database() AS database, current_user AS role, inet_server_port() AS port,
      rolsuper AS superuser, rolbypassrls AS bypass FROM pg_roles WHERE rolname=current_user`;
  if (identity.length !== 1 || identity[0].database !== "planora_wave1_test" || identity[0].port !== 55440 || identity[0].superuser || identity[0].bypass) throw new Error("Database identity or privilege verification failed");
  console.log("Isolated Wave 1 identity verified:", identity[0]);
} catch {
  throw new Error("Isolated Wave 1 database preflight failed; no command executed");
} finally { await db.$disconnect(); }
const [script, ...args] = process.argv.slice(2);
if (script) {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: "inherit", env: process.env });
  process.exitCode = result.status ?? 1;
}
