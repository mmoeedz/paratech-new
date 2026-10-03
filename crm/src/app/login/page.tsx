import { redirect } from "next/navigation";
import { getUser, hasAnyUser } from "@/lib/auth";
import { loginAction } from "@/app/actions/auth";
import { Flash, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!hasAnyUser()) redirect("/setup");
  if (await getUser()) redirect("/");
  const q = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <div className="mb-8">
        <div className="text-2xl font-semibold tracking-tight">ParaTech <span className="text-copper">CRM</span></div>
        <p className="muted mt-1">Sign in to start calling.</p>
      </div>
      <Flash err={sp(q.err)} ok={sp(q.ok)} />
      <form action={loginAction} className="card card-pad space-y-4">
        <label className="block">
          <span className="lbl">Email</span>
          <input className="input" name="email" type="email" autoComplete="username" required autoFocus />
        </label>
        <label className="block">
          <span className="lbl">Password</span>
          <input className="input" name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn btn-primary w-full" type="submit">Sign in</button>
      </form>
    </main>
  );
}
