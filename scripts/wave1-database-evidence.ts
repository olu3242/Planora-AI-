import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { requireIsolatedTestDatabaseUrl } from "./test-database-url";

const db = new PrismaClient({ datasourceUrl: requireIsolatedTestDatabaseUrl(process.env.TEST_DATABASE_URL) });
try {
  const migrations = await db.$queryRaw<Array<{ migration_name: string; checksum: string; finished_at: Date | null }>>`SELECT migration_name,checksum,finished_at FROM _prisma_migrations ORDER BY migration_name`;
  const alignment = migrations.map(m => ({ name: m.migration_name, finished: !!m.finished_at, checksumMatches: createHash("sha256").update(readFileSync(`prisma/migrations/${m.migration_name}/migration.sql`)).digest("hex") === m.checksum }));
  const tables = await db.$queryRaw<Array<{ name: string; rls: boolean; forced: boolean }>>`SELECT c.relname AS name,c.relrowsecurity AS rls,c.relforcerowsecurity AS forced FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=current_schema() AND c.relkind='r' AND c.relname <> '_prisma_migrations' ORDER BY c.relname`;
  const policies = await db.$queryRaw`SELECT tablename,policyname FROM pg_policies WHERE schemaname=current_schema()`;
  const evidence = { migrations: alignment, tableCount: tables.length, tables, policies, rowLevelSecurityCertified: tables.length > 0 && tables.every(t => t.rls && t.forced) };
  writeFileSync("evidence/wave1/database-evidence.json", JSON.stringify(evidence, null, 2));
  console.log({ migrations: alignment.length, checksumsAligned: alignment.every(m => m.finished && m.checksumMatches), tables: tables.length, rlsTables: tables.filter(t => t.rls).length });
} finally { await db.$disconnect(); }
