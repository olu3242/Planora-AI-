"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    if (!response.ok) { const body = await response.json(); setError(body.error?.message ?? "Sign in failed."); setPending(false); return; }
    router.replace("/command-center"); router.refresh();
  }
  return <form className="form-stack" onSubmit={submit}><label className="field">Email<input name="email" type="email" autoComplete="username" defaultValue="cfo@planora.local" required /></label><label className="field">Password<input name="password" type="password" autoComplete="current-password" defaultValue="Planora!2026" required /></label>{error && <div className="error-box" role="alert">{error}</div>}<button className="button button-primary" type="submit" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button></form>;
}
