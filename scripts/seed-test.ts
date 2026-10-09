import { requireIsolatedTestDatabaseUrl } from "./test-database-url";

if (process.env.APP_ENV !== "test") throw new Error("APP_ENV=test is required for test seeding.");
process.env.DATABASE_URL = requireIsolatedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
await import("../database/seeds/index");