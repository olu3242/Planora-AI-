import { isolatedTestDatabaseUrl } from "../scripts/test-database-url";

if (process.env.APP_ENV && process.env.APP_ENV !== "test") {
	throw new Error("Vitest requires APP_ENV=test.");
}
process.env.APP_ENV = "test";
process.env.APP_URL ??= "http://127.0.0.1:3000";
process.env.DATABASE_URL = isolatedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
process.env.SESSION_COOKIE_NAME ??= "planora_session";
process.env.SESSION_TTL_HOURS ??= "12";
