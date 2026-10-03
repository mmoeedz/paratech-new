import { redirect } from "next/navigation";
import { getUser, hasAnyUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!hasAnyUser()) redirect("/setup");
  const user = await getUser();
  if (!user) redirect("/login");
  redirect(user.role === "caller" ? "/queue" : "/dashboard");
}
