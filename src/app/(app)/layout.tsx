import { requirePageSession } from "@/auth/session";
import { AppShell } from "@/components/app-shell";

<<<<<<< HEAD
export const dynamic = "force-dynamic";

=======
>>>>>>> origin/main
export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell session={await requirePageSession()}>{children}</AppShell>;
}
