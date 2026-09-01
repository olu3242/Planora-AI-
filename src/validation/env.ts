import { z } from "zod";

const booleanFlag = z.enum(["true", "false"]).default("true").transform((value) => value === "true");

const schema = z.object({
  APP_ENV: z.enum(["development", "test", "preview", "production"]).default("development"),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().startsWith("postgresql://"),
  SESSION_COOKIE_NAME: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().max(168),
  AGENTIC_OS_ENABLED: booleanFlag,
  AGENT_EXECUTION_ENABLED: booleanFlag,
  AI_COMMENTARY_ENABLED: booleanFlag,
});

export type Environment = z.infer<typeof schema>;

export function parseEnvironment(input: Record<string, string | undefined>): Environment {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid environment configuration: ${fields}`);
  }
  return result.data;
}

let cached: Environment | undefined;
export function env(): Environment {
  if (process.env.APP_ENV === "test") return parseEnvironment(process.env);
  cached ??= parseEnvironment(process.env);
  return cached;
}
