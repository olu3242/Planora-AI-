import { describe, expect, it } from "vitest";
import {
  isolatedTestDatabaseUrl,
  requireIsolatedTestDatabaseUrl,
} from "../../scripts/test-database-url";

describe("isolated test database URL", () => {
  it("accepts only a loopback PostgreSQL test database", () => {
    const url = "postgresql://tester:secret@127.0.0.1:55432/planora_test?schema=public";
    expect(isolatedTestDatabaseUrl(url)).toBe(url);
  });

  it("rejects non-loopback hosts even when the database name looks isolated", () => {
    expect(() => isolatedTestDatabaseUrl("postgresql://tester:secret@db.example/planora_test"))
      .toThrow("loopback host");
  });

  it("rejects a loopback database without a test-only name", () => {
    expect(() => isolatedTestDatabaseUrl("postgresql://tester:secret@127.0.0.1/planora"))
      .toThrow("ending in _test");
  });

  it("rejects non-PostgreSQL URLs", () => {
    expect(() => isolatedTestDatabaseUrl("file:./planora_test.db"))
      .toThrow("PostgreSQL");
  });

  it("uses an unreachable test-only URL when no database is configured", () => {
    expect(isolatedTestDatabaseUrl(undefined)).toBe(
      "postgresql://test:test@127.0.0.1:1/planora_test?schema=public",
    );
  });

  it("requires an explicit URL for database operations", () => {
    expect(() => requireIsolatedTestDatabaseUrl(undefined))
      .toThrow("TEST_DATABASE_URL is required");
  });
});