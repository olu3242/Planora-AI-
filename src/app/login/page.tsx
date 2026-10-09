import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getSession()) redirect("/command-center");
  return <main className="login-page"><section className="login-panel"><Link className="brand" href="/"><span className="brand-mark" />Planora</Link><h1>Sign in</h1><p className="subtle">Use your organization credentials to continue.</p><LoginForm /></section><section className="login-context"><h2>Financial truth, governed from source to forecast.</h2><p>Bring the model your team already uses. Planora establishes lineage, reconciliation, certification, and accountable forecast approvals around it.</p></section></main>;
}
