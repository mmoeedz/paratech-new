import { redirect } from "next/navigation";
import { hasAnyUser } from "@/lib/auth";
import { setupAction } from "@/app/actions/auth";
import { Flash, sp } from "@/components/ui";
import { ALL_TIMEZONES } from "@/lib/geo";

export const dynamic = "force-dynamic";

export default async function SetupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (hasAnyUser()) redirect("/login");
  const q = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8">
        <div className="text-2xl font-semibold tracking-tight">Set up <span className="text-copper">ParaTech CRM</span></div>
        <p className="muted mt-1">Create your organization and the first admin account. You can invite callers and team leads next.</p>
      </div>
      <Flash err={sp(q.err)} />
      <form action={setupAction} className="card card-pad space-y-4">
        <label className="block"><span className="lbl">Organization name</span>
          <input className="input" name="org" defaultValue="ParaTech" required /></label>
        <label className="block"><span className="lbl">Your name</span>
          <input className="input" name="name" autoComplete="name" required /></label>
        <label className="block"><span className="lbl">Email</span>
          <input className="input" name="email" type="email" autoComplete="username" required /></label>
        <label className="block"><span className="lbl">Password</span>
          <input className="input" name="password" type="password" autoComplete="new-password" minLength={10} required />
          <span className="faint mt-1 block">At least 10 characters, with letters and a number.</span></label>
        <label className="block"><span className="lbl">Your time zone</span>
          <select className="select" name="timezone" defaultValue="America/New_York">
            {ALL_TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select></label>
        <button className="btn btn-primary w-full" type="submit">Create account</button>
      </form>
    </main>
  );
}
