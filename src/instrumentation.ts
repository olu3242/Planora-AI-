import { env } from "@/validation/env";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") env();
}
