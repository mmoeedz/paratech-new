import Link from "next/link";
import { requireRole, listUsers } from "@/lib/auth";
import { all } from "@/lib/db";
import { getSettings, listOptions, listOutcomes, OPTION_KINDS, OUTCOME_ACTIONS } from "@/lib/settings";
import { listStages } from "@/lib/deals";
import { listFields } from "@/lib/fields";
import { emailConfigured } from "@/lib/email";
import { ALL_TIMEZONES } from "@/lib/geo";
import {
  addFieldAction, addOptionAction, addUserAction, deleteStageAction, removeFieldAction, removeOptionAction, resetPasswordAction,
  saveGeneralAction, saveOutcomeAction, saveStageAction, updateUserAction,
} from "@/app/actions/settings";
import { Field, Flash, PageHeader, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

const TABS = [
  ["general", "General"], ["lists", "Niches & lists"], ["outcomes", "Call outcomes"], ["pipeline", "Pipeline"], ["fields", "Custom fields"], ["team", "Team"], ["data", "Data export"],
] as const;

const ACTION_HELP: Record<string, string> = {
  retry: "Retry after N days", gatekeeper: "Ask for decision-maker + best time, then retry", bad_number: "Mark the number bad",
  dead: "Close the lead (reason + optional re-contact)", callback: "Ask for a date/time and create a callback",
  deal: "Open a deal in the pipeline", meeting: "Open the meeting form", dnc: "Block the number permanently",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("admin");
  const q = await searchParams;
  const tab = TABS.some((t) => t[0] === sp(q.tab)) ? sp(q.tab) : "general";
  const s = getSettings(user.org_id);

  return (
    <>
      <PageHeader title="Settings" subtitle="Admins only." />
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Settings sections">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/settings?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`btn btn-sm ${tab === k ? "!border-copper !bg-copper/15 !text-copper-light" : ""}`}>{label}</Link>
        ))}
      </nav>

      {tab === "general" && (
        <form action={saveGeneralAction} className="card card-pad grid max-w-3xl gap-4 sm:grid-cols-2">
          <h2 className="h2 sm:col-span-2">Calling rules</h2>
          <Field label="Earliest call (hour, lead's local time)" hint="Legal floor is 8."><input className="input" name="calling_start_hour" type="number" min={8} max={20} defaultValue={s.calling_start_hour} /></Field>
          <Field label="Latest call (hour, lead's local time)" hint="Legal ceiling is 21 (9pm)."><input className="input" name="calling_end_hour" type="number" min={9} max={21} defaultValue={s.calling_end_hour} /></Field>
          <Field label="Safety margin for approximate time zones (hours)" hint="Applied at both ends when a state spans two zones."><input className="input" name="approx_pad_hours" type="number" min={0} max={3} defaultValue={s.approx_pad_hours} /></Field>
          <Field label="Maximum call attempts per lead"><input className="input" name="max_attempts" type="number" min={1} max={30} defaultValue={s.max_attempts} /></Field>
          <Field label="Re-contact 'not interested' leads after (days)"><input className="input" name="recontact_days" type="number" min={1} defaultValue={s.recontact_days} /></Field>
          <Field label="Lead lock (minutes)" hint="How long an opened lead stays reserved for its caller."><input className="input" name="lock_minutes" type="number" min={1} max={240} defaultValue={s.lock_minutes} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="block_national_dnc" defaultChecked={s.block_national_dnc === 1} className="accent-copper" /> Treat National DNC Registry matches as blocked (recommended)</label>
          <h2 className="h2 mt-2 sm:col-span-2">Company &amp; email</h2>
          <Field label="Company name"><input className="input" name="company_name" defaultValue={s.company_name} /></Field>
          <Field label="Reply-to email (optional)"><input className="input" type="email" name="reply_to_email" defaultValue={s.reply_to_email} /></Field>
          <Field label="Postal address (required in every commercial email — CAN-SPAM)" className="sm:col-span-2"><input className="input" name="company_address" defaultValue={s.company_address} placeholder="123 Main St, Suite 4, City, ST 00000" /></Field>
          <p className="faint sm:col-span-2">Email provider: {emailConfigured() ? "Resend is configured." : "not configured (set RESEND_API_KEY) — emails are saved as drafts only."}</p>
          <div className="sm:col-span-2"><button className="btn btn-primary" type="submit">Save</button></div>
        </form>
      )}

      {tab === "lists" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {OPTION_KINDS.map((k) => (
            <section key={k.kind} className="card card-pad">
              <h2 className="h2">{k.title}</h2>
              <p className="faint mb-3">{k.hint}</p>
              <ul className="mb-3 flex flex-wrap gap-2">
                {listOptions(user.org_id, k.kind).map((o) => (
                  <li key={o.id} className="badge badge-slate gap-1.5">
                    {o.label}
                    <form action={removeOptionAction} className="inline"><input type="hidden" name="id" value={o.id} /><button type="submit" className="text-faint hover:text-bad" aria-label={`Remove ${o.label}`}>×</button></form>
                  </li>
                ))}
              </ul>
              <form action={addOptionAction} className="flex gap-2"><input type="hidden" name="kind" value={k.kind} /><input className="input" name="label" placeholder="Add…" aria-label={`Add to ${k.title}`} required /><button className="btn" type="submit">Add</button></form>
            </section>
          ))}
        </div>
      )}

      {tab === "outcomes" && (
        <div className="space-y-3">
          <p className="muted max-w-3xl">Each outcome runs an automatic next step. Edit the retry gaps here; the maximum attempts is under General. Lower “order” numbers appear first.</p>
          {[...listOutcomes(user.org_id, true), null].map((o) => (
            <form key={o?.id ?? "new"} action={saveOutcomeAction} className="card card-pad grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {o ? <input type="hidden" name="id" value={o.id} /> : <div className="h2 lg:col-span-7">Add an outcome</div>}
              <Field label="Name" className="lg:col-span-2"><input className="input" name="label" defaultValue={o?.label ?? ""} required /></Field>
              <Field label="What happens" className="lg:col-span-2">
                <select className="select" name="action" defaultValue={o?.action ?? "retry"}>{OUTCOME_ACTIONS.map((a) => <option key={a} value={a}>{ACTION_HELP[a]}</option>)}</select>
              </Field>
              <Field label="Retry (days)"><input className="input" name="retry_days" type="number" min={0} defaultValue={o?.retry_days ?? ""} /></Field>
              <Field label="Order"><input className="input" name="sort" type="number" defaultValue={o?.sort ?? 50} /></Field>
              <Field label="Colour">
                <select className="select" name="color" defaultValue={o?.color ?? "slate"}>{["slate", "amber", "rose", "sky", "emerald"].map((c) => <option key={c}>{c}</option>)}</select>
              </Field>
              <div className="flex flex-wrap items-center gap-4 lg:col-span-5">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_conversation" defaultChecked={o ? o.is_conversation === 1 : false} className="accent-copper" /> Counts as a conversation</label>
                {o && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={o.active === 1} className="accent-copper" /> Shown to callers</label>}
              </div>
              <button className="btn btn-primary lg:col-span-2" type="submit">{o ? "Save" : "Add outcome"}</button>
            </form>
          ))}
        </div>
      )}

      {tab === "pipeline" && (
        <div className="space-y-3">
          <p className="muted max-w-3xl">Stages appear left to right on the Deals board by “order”. “Won” and “Lost” stages close the deal and update the lead.</p>
          {[...listStages(user.org_id), null].map((st) => (
            <form key={st?.id ?? "new"} action={saveStageAction} className="card card-pad grid items-end gap-3 sm:grid-cols-4">
              {st ? <input type="hidden" name="id" value={st.id} /> : <div className="h2 sm:col-span-4">Add a stage</div>}
              <Field label="Name"><input className="input" name="name" defaultValue={st?.name ?? ""} required /></Field>
              <Field label="Type"><select className="select" name="kind" defaultValue={st?.kind ?? "open"}><option value="open">Open</option><option value="won">Won</option><option value="lost">Lost</option></select></Field>
              <Field label="Order"><input className="input" name="sort" type="number" defaultValue={st?.sort ?? 50} /></Field>
              <div className="flex gap-2">
                <button className="btn btn-primary" type="submit">{st ? "Save" : "Add"}</button>
                {st && <button className="btn btn-danger" type="submit" formAction={deleteStageAction} formNoValidate>Delete</button>}
              </div>
            </form>
          ))}
        </div>
      )}

      {tab === "fields" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card card-pad">
            <h2 className="h2 mb-3">Custom fields</h2>
            {listFields(user.org_id).length === 0 ? <p className="muted">None yet.</p> : (
              <ul className="space-y-2 text-sm">
                {listFields(user.org_id).map((f) => (
                  <li key={f.id} className="flex items-center justify-between"><span>{f.label} <span className="badge badge-slate ml-1">{f.entity} · {f.type}</span></span>
                    <form action={removeFieldAction}><input type="hidden" name="id" value={f.id} /><button className="btn btn-danger btn-sm" type="submit">Remove</button></form></li>
                ))}
              </ul>
            )}
          </section>
          <form action={addFieldAction} className="card card-pad space-y-3">
            <h2 className="h2">Add a field</h2>
            <Field label="Label"><input className="input" name="label" placeholder="e.g. Number of locations" required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="On"><select className="select" name="entity"><option value="lead">Leads</option><option value="deal">Deals</option></select></Field>
              <Field label="Type"><select className="select" name="type"><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="select">Dropdown</option><option value="yesno">Yes / No</option></select></Field>
            </div>
            <Field label="Dropdown choices (one per line)"><textarea className="textarea min-h-20" name="options" /></Field>
            <button className="btn btn-primary" type="submit">Add field</button>
          </form>
        </div>
      )}

      {tab === "team" && (
        <div className="space-y-6">
          <div className="card overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Person</th><th>Role</th><th>Active</th><th /><th>Reset password</th></tr></thead>
              <tbody>
                {listUsers(user.org_id, { includeInactive: true }).map((u) => (
                  <tr key={u.id}>
                    <td><div className="font-medium">{u.name}</div><div className="faint">{u.email}</div></td>
                    <td colSpan={3}>
                      <form action={updateUserAction} className="flex flex-wrap items-center gap-3">
                        <input type="hidden" name="id" value={u.id} />
                        <select className="select !w-auto" name="role" defaultValue={u.role} aria-label={`Role for ${u.name}`}>
                          <option value="admin">Admin</option><option value="team_lead">Team lead</option><option value="caller">Caller</option>
                        </select>
                        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="active" defaultChecked={u.active === 1} className="accent-copper" /> Active</label>
                        <button className="btn btn-sm" type="submit">Save</button>
                      </form>
                    </td>
                    <td>
                      <form action={resetPasswordAction} className="flex gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <input className="input !w-40" type="password" name="password" placeholder="New password" autoComplete="new-password" aria-label={`New password for ${u.name}`} required />
                        <button className="btn btn-sm" type="submit">Reset</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form action={addUserAction} className="card card-pad grid max-w-3xl gap-3 sm:grid-cols-2">
            <h2 className="h2 sm:col-span-2">Add a team member</h2>
            <Field label="Name"><input className="input" name="name" required /></Field>
            <Field label="Email"><input className="input" type="email" name="email" required /></Field>
            <Field label="Role"><select className="select" name="role" defaultValue="caller"><option value="caller">Caller — sees only their own leads</option><option value="team_lead">Team lead — sees the whole team, assigns lists</option><option value="admin">Admin — everything, including settings</option></select></Field>
            <Field label="Time zone"><select className="select" name="timezone" defaultValue="America/New_York">{ALL_TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
            <Field label="Initial password" hint="At least 10 characters with letters and a number. Share it securely; they can change it from their profile." className="sm:col-span-2"><input className="input" type="password" name="password" autoComplete="new-password" minLength={10} required /></Field>
            <div className="sm:col-span-2"><button className="btn btn-primary" type="submit">Add member</button></div>
          </form>
          <p className="faint">Recent admin actions: {all<{ action: string; detail: string | null; created_at: string }>("SELECT action, detail, created_at FROM audit_log WHERE org_id = ? ORDER BY id DESC LIMIT 5", user.org_id).map((a) => `${a.action}${a.detail ? ` (${a.detail})` : ""}`).join(" · ") || "none"}</p>
        </div>
      )}

      {tab === "data" && (
        <section className="card card-pad max-w-xl">
          <h2 className="h2 mb-3">Export your data</h2>
          <p className="muted mb-4">You own your data. Download CSVs any time.</p>
          <div className="flex flex-wrap gap-2">
            {["leads", "calls", "deals", "meetings", "dnc"].map((k) => <a key={k} className="btn" href={`/api/export/${k}`}>{k === "dnc" ? "Do-not-call" : k[0].toUpperCase() + k.slice(1)} CSV</a>)}
          </div>
        </section>
      )}
    </>
  );
}
