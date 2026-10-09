import { clearSession } from "@/auth/session";
import { redirect } from "next/navigation";

export async function POST() { await clearSession(); redirect("/login"); }
