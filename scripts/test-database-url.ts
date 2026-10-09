const UNAVAILABLE_TEST_DATABASE_URL =
  "postgresql://test:test@127.0.0.1:1/planora_test?schema=public";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function requireIsolatedTestDatabaseUrl(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error("TEST_DATABASE_URL is required for database operations.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL.");
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(url.protocol)) {
    throw new Error("TEST_DATABASE_URL must use PostgreSQL.");
  }
  if (!LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error("TEST_DATABASE_URL must use a loopback host.");
  }
  if (!databaseName.toLowerCase().endsWith("_test")) {
    throw new Error("TEST_DATABASE_URL must target a database ending in _test.");
  }

  return value;
}

export function isolatedTestDatabaseUrl(value: string | undefined): string {
  return value?.trim()
    ? requireIsolatedTestDatabaseUrl(value)
    : UNAVAILABLE_TEST_DATABASE_URL;
}