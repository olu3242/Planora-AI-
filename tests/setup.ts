<<<<<<< HEAD
import { isolatedTestDatabaseUrl } from "../scripts/test-database-url";

if (process.env.APP_ENV && process.env.APP_ENV !== "test") {
	throw new Error("Vitest requires APP_ENV=test.");
}
process.env.APP_ENV = "test";
process.env.APP_URL ??= "http://127.0.0.1:3000";
process.env.DATABASE_URL = isolatedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
=======
process.env.APP_ENV ??= "test";
process.env.APP_URL ??= "http://127.0.0.1:3000";
process.env.DATABASE_URL ??= "postgresql://planora:planora_local_only@127.0.0.1:55432/planora?schema=public";
>>>>>>> origin/main
process.env.SESSION_COOKIE_NAME ??= "planora_session";
process.env.SESSION_TTL_HOURS ??= "12";
