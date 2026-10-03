import { requireUser } from "@/lib/auth";
import { changePasswordAction, updateProfileAction } from "@/app/actions/auth";
import { Field, Flash, PageHeader, sp } from "@/components/ui";
import { ALL_TIMEZONES } from "@/lib/geo";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  return (
    <>
      <PageHeader title="Your profile" subtitle="Your time zone controls how callbacks and meetings are shown to you." />
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={updateProfileAction} className="card card-pad space-y-4">
          <h2 className="h2">Details</h2>
          <Field label="Name"><input className="input" name="name" defaultValue={user.name} required /></Field>
          <Field label="Email"><input className="input" value={user.email} disabled readOnly /></Field>
          <Field label="Time zone">
            <select className="select" name="timezone" defaultValue={user.timezone}>
              {ALL_TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Zoom Phone email" hint="Only if it differs from your login email — used to match your Zoom call logs.">
            <input className="input" name="zoom_email" type="email" defaultValue={user.zoom_email ?? ""} />
          </Field>
          <button className="btn btn-primary" type="submit">Save</button>
        </form>
        <form action={changePasswordAction} className="card card-pad space-y-4">
          <h2 className="h2">Change password</h2>
          <Field label="Current password"><input className="input" type="password" name="current" autoComplete="current-password" required /></Field>
          <Field label="New password" hint="At least 10 characters, with letters and a number. Other devices are signed out.">
            <input className="input" type="password" name="next" autoComplete="new-password" minLength={10} required />
          </Field>
          <button className="btn btn-primary" type="submit">Change password</button>
        </form>
      </div>
    </>
  );
}
