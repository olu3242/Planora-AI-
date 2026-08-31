import { redirect } from "next/navigation";
import { getSession } from "@/auth/session";

export default async function Home() {
  redirect((await getSession()) ? "/command-center" : "/login");
}
