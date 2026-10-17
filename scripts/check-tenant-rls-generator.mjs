import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

// Generate into a disposable directory. Never rewrite historical migration SQL.
const root = mkdtempSync(join(tmpdir(), "planora-rls-drift-"));
const files = [
  "prisma/migrations/20261009060000_tenant_rls/migration.sql",
  "docs/tenant-rls-manifest.json",
];
try {
  mkdirSync(join(root, "prisma"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "prisma/schema.prisma"), readFileSync("prisma/schema.prisma"));
  writeFileSync(join(root, "scripts/generate-tenant-rls.mjs"), readFileSync("scripts/generate-tenant-rls.mjs"));
  const generated = spawnSync(process.execPath, ["scripts/generate-tenant-rls.mjs"], {
    cwd: root, encoding: "utf8", timeout: 30000,
  });
  if (generated.error || generated.status !== 0) {
    throw new Error("TENANT_RLS_GENERATOR_FAILED: " + (generated.stderr || generated.error?.message || generated.status));
  }
  for (const file of files) {
    const committed = createHash("sha256").update(readFileSync(resolve(file))).digest("hex");
    const regenerated = createHash("sha256").update(readFileSync(join(root, file))).digest("hex");
    if (committed !== regenerated) {
      throw new Error("TENANT_RLS_GENERATOR_DRIFT: " + file);
    }
  }
  process.stdout.write("Tenant RLS SQL and manifest match deterministic generator.\n");
} finally {
  rmSync(root, { recursive: true, force: true });
}
