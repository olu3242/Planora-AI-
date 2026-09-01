import { requirePageSession } from "@/auth/session";
import { AppShell } from "@/components/app-shell";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell session={await requirePageSession()}>{children}</AppShell>;
}
