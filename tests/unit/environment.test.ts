import { describe, expect, it } from "vitest";
import { parseEnvironment } from "@/validation/env";

const valid = { APP_ENV: "test", APP_URL: "http://127.0.0.1:3000", DATABASE_URL: "postgresql://a:b@localhost:5432/x", SESSION_COOKIE_NAME: "session", SESSION_TTL_HOURS: "12" };
describe("environment", () => {
  it("parses a valid environment", () => expect(parseEnvironment(valid).SESSION_TTL_HOURS).toBe(12));
  it("fails closed for a non-PostgreSQL database", () => expect(() => parseEnvironment({ ...valid, DATABASE_URL: "file:test.db" })).toThrow("DATABASE_URL"));
  it("rejects excessive session lifetime", () => expect(() => parseEnvironment({ ...valid, SESSION_TTL_HOURS: "999" })).toThrow("SESSION_TTL_HOURS"));
});
