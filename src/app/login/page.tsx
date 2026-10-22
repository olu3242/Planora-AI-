import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/auth/session";
import { LoginForm } from "./login-form";
import { PlanoraLogo } from "@/components/planora-logo";

export default async function LoginPage() {
  if (await getSession()) redirect("/command-center");
  return <main className="login-page"><section className="login-panel"><Link className="brand" href="/"><PlanoraLogo/></Link><h1>Sign in</h1><p className="subtle">Use your organization credentials to continue.</p><LoginForm /></section><section className="login-context"><h2>Your finance operations. Finally working together.</h2><p>Bring the model your team already uses. Planora establishes lineage, reconciliation, certification, and accountable forecast approvals around it.</p></section></main>;
}
