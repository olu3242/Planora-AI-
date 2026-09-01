import { describe, expect, it } from "vitest";
import { parseEnvironment } from "@/validation/env";

const valid = { APP_ENV: "test", APP_URL: "http://127.0.0.1:3000", DATABASE_URL: "postgresql://a:b@localhost:5432/x", SESSION_COOKIE_NAME: "session", SESSION_TTL_HOURS: "12" };
describe("environment", () => {
  it("parses a valid environment with safe deterministic agent defaults", () => expect(parseEnvironment(valid)).toMatchObject({ SESSION_TTL_HOURS: 12, AGENTIC_OS_ENABLED: true, AGENT_EXECUTION_ENABLED: true, AI_COMMENTARY_ENABLED: true }));
  it("parses explicit operational kill switches", () => expect(parseEnvironment({ ...valid, AGENTIC_OS_ENABLED: "false", AGENT_EXECUTION_ENABLED: "false", AI_COMMENTARY_ENABLED: "false" })).toMatchObject({ AGENTIC_OS_ENABLED: false, AGENT_EXECUTION_ENABLED: false, AI_COMMENTARY_ENABLED: false }));
  it("rejects ambiguous feature-flag values", () => expect(() => parseEnvironment({ ...valid, AGENTIC_OS_ENABLED: "1" })).toThrow("AGENTIC_OS_ENABLED"));
  it("fails closed for a non-PostgreSQL database", () => expect(() => parseEnvironment({ ...valid, DATABASE_URL: "file:test.db" })).toThrow("DATABASE_URL"));
  it("rejects excessive session lifetime", () => expect(() => parseEnvironment({ ...valid, SESSION_TTL_HOURS: "999" })).toThrow("SESSION_TTL_HOURS"));
});
