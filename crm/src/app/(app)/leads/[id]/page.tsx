import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, isManager, listUsers } from "@/lib/auth";
import { canSeeLead, getLead, getPhones, LEAD_STATUSES, callWindow } from "@/lib/leads";
import { all, get } from "@/lib/db";
import { listOutcomes, getSettings, optionLabels } from "@/lib/settings";
import { listFields } from "@/lib/fields";
import { formatPhone } from "@/lib/phone";
import { fmtDateTime } from "@/lib/time";
import { ALL_TIMEZONES, STATE_NAMES } from "@/lib/geo";
import { getTemplate, listTemplates, nextMeetingDetails, renderTemplate, emailConfigured } from "@/lib/email";
import { leadMeetings } from "@/lib/meetings";
import { openDealForLead } from "@/lib/deals";
import {
  addNoteAction, addPhoneAction, createDealAction, createTaskAction, markDncAction, reassignAction, scheduleMeetingAction,
  sendEmailAction, setStatusAction, toggleOptoutAction, updateLeadAction, updatePhoneAction,
} from "@/app/actions/leads";
import { completeTaskAction } from "@/app/actions/tasks";
import { CallPanel } from "@/components/CallPanel";
import { CopyButton } from "@/components/CopyButton";
import { CustomFieldInputs } from "@/components/CustomFieldInputs";
import { LeadClock } from "@/components/LeadClock";
import { Field, Flash, StatusBadge, money, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

const ICON: Record<string, string> = { call: "📞", note: "📝", callback: "⏰", task: "✅", meeting: "📅", email: "✉️", deal: "💼", status: "🔄", dnc: "⛔", assign: "👤", created: "✨", edit: "✏️", recording: "🎙️" };

export default async function LeadPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const { id } = await params;
  const q = await searchParams;
  const lead = getLead(user.org_id, Number(id));
  if (!lead || !canSeeLead(user, lead)) notFound();

  const manager = isManager(user);
  const settings = getSettings(user.org_id);
  const w = callWindow(user.org_id);
  const phones = getPhones(lead.id);
  const timeline = all<{ id: number; type: string; summary: string; body: string | null; created_at: string; user_name: string | null }>(
    `SELECT a.id, a.type, a.summary, a.body, a.created_at, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id
     WHERE a.lead_id = ? ORDER BY a.created_at DESC, a.id DESC LIMIT 200`,
    lead.id,
  );
  const tasks = all<{ id: number; type: string; title: string; due_at: string; lead_tz: string | null; assignee: string; user_id: number }>(
    `SELECT t.id, t.type, t.title, t.due_at, t.lead_tz, u.name AS assignee, t.user_id FROM tasks t JOIN users u ON u.id = t.user_id
     WHERE t.lead_id = ? AND t.done_at IS NULL ORDER BY t.due_at`,
    lead.id,
  );
  const meetings = leadMeetings(user.org_id, lead.id);
  const deal = openDealForLead(user.org_id, lead.id);
  const owner = lead.assigned_to ? get<{ name: string }>("SELECT name FROM users WHERE id = ?", lead.assigned_to)?.name : null;
  const list = lead.list_id ? get<{ id: number; name: string }>("SELECT id, name FROM call_lists WHERE id = ?", lead.list_id) : null;
  const team = manager ? listUsers(user.org_id) : [];
  const fields = listFields(user.org_id, "lead");
  const custom: Record<string, string> = JSON.parse(lead.custom || "{}");
  const outcomes = listOutcomes(user.org_id);
  const templates = listTemplates(user.org_id);
  const tpl = sp(q.tpl) ? getTemplate(user.org_id, Number(sp(q.tpl))) : undefined;
  const extra = { meeting_details: nextMeetingDetails(user.org_id, lead.id, user.timezone) };
  const subject = tpl ? renderTemplate(tpl.subject, lead, user, extra) : "";
  const body = tpl ? renderTemplate(tpl.body, lead, user, extra) : "";
  const dnc = lead.status === "dnc";
  const search = `https://www.google.com/search?q=${encodeURIComponent([lead.business_name, lead.city, lead.state].filter(Boolean).join(" "))}`;
  const here = `/leads/${lead.id}`;

  return (
    <>
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/leads" className="faint hover:text-cloud">← Leads</Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{lead.business_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={lead.status} />
            {lead.dead_reason && ["dead", "dnc"].includes(lead.status) && <span className="faint">{lead.dead_reason}</span>}
            <span className="faint">{[lead.niche, [lead.city, lead.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</span>
            {list && manager && <Link className="badge badge-slate" href={`/lists/${list.id}`}>{list.name}</Link>}
            <span className="faint">Caller: {owner ?? "unassigned"}</span>
          </div>
          <div className="mt-2"><LeadClock tz={lead.timezone} approx={lead.tz_approx === 1} start={w.start} end={w.end} pad={w.approxPad} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-sm" href={search} target="_blank" rel="noreferrer noopener">Google this business ↗</a>
          {!dnc && (
            <form action={markDncAction}>
              <input type="hidden" name="leadId" value={lead.id} />
              <button className="btn btn-danger btn-sm" type="submit" title="Blocks every number on this lead permanently">Mark do-not-call</button>
            </form>
          )}
        </div>
      </div>

      {dnc && <p className="mb-5 rounded-lg border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">This lead is on the do-not-call list. Its numbers are blocked and it can&apos;t be called or emailed.</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="space-y-6">
          {!dnc && (
            <section className="card card-pad" aria-labelledby="logcall">
              <h2 id="logcall" className="h2 mb-1">Log a call</h2>
              <p className="faint mb-4">For calls made outside My Queue. Dial in Zoom, then record the outcome here.</p>
              <CallPanel
                leadId={lead.id} leadTz={lead.timezone} userTz={user.timezone} returnTo={here}
                outcomes={outcomes.map((o) => ({ key: o.key, label: o.label, action: o.action, color: o.color }))}
                phones={phones.map((p) => ({ phone: p.phone, display: formatPhone(p.phone), bad: p.bad === 1, type: p.phone_type }))}
                deadReasons={optionLabels(user.org_id, "dead_reason")} services={optionLabels(user.org_id, "service")}
                maxAttempts={settings.max_attempts} attempts={lead.attempts} recontactDays={settings.recontact_days} compact
              />
            </section>
          )}

          <section className="card card-pad" aria-labelledby="timeline">
            <h2 id="timeline" className="h2 mb-4">Timeline</h2>
            <form action={addNoteAction} className="mb-5 flex gap-2">
              <input type="hidden" name="leadId" value={lead.id} />
              <textarea className="textarea min-h-16 flex-1" name="body" placeholder="Add a note…" aria-label="Note" required />
              <button className="btn self-end" type="submit">Add note</button>
            </form>
            <ol className="space-y-4">
              {timeline.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-0.5 w-6 text-center" aria-hidden>{ICON[a.type] ?? "•"}</span>
                  <div className="min-w-0">
                    <div className="text-sm">{a.type === "note" ? <span className="font-medium">Note</span> : a.summary}</div>
                    {a.body && (
                      /^https?:\/\//.test(a.body)
                        ? <a className="text-sm text-copper-light underline" href={a.body} target="_blank" rel="noreferrer noopener">Open recording ↗</a>
                        : <p className="muted mt-0.5 whitespace-pre-wrap">{a.body}</p>
                    )}
                    <div className="faint mt-0.5">{a.user_name ?? "System"} · {fmtDateTime(a.created_at, user.timezone)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card card-pad" aria-labelledby="phones">
            <h2 id="phones" className="h2 mb-3">Phone numbers</h2>
            <ul className="space-y-2">
              {phones.map((p) => (
                <li key={p.id} className="rounded-lg border border-line bg-elevated px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-mono tabular-nums ${p.bad ? "text-faint line-through" : ""}`}>{formatPhone(p.phone)}</span>
                    {!p.bad && !dnc && <CopyButton text={p.phone.replace("+1", "")} />}
                  </div>
                  {p.bad === 1 && <div className="badge badge-bad mt-1">bad: {p.bad_reason}</div>}
                  <form action={updatePhoneAction} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="phoneId" value={p.id} />
                    <select className="select !w-auto !py-1 text-xs" name="phone_type" defaultValue={p.phone_type} aria-label="Phone type">
                      <option value="unknown">Type: unknown</option><option value="mobile">Mobile</option><option value="landline">Landline</option><option value="voip">VoIP</option>
                    </select>
                    <button className="btn btn-sm" name="intent" value="type" type="submit">Save</button>
                    {!p.bad ? <button className="btn btn-sm" name="intent" value="bad" type="submit">Mark bad</button>
                      : p.bad_reason !== "do not call" && <button className="btn btn-sm" name="intent" value="unbad" type="submit">Restore</button>}
                  </form>
                </li>
              ))}
            </ul>
            {!dnc && (
              <form action={addPhoneAction} className="mt-3 flex gap-2">
                <input type="hidden" name="leadId" value={lead.id} />
                <input className="input" name="phone" inputMode="tel" placeholder="Add a number" aria-label="New phone number" required />
                <button className="btn" type="submit">Add</button>
              </form>
            )}
          </section>

          <section className="card card-pad" aria-labelledby="followups">
            <h2 id="followups" className="h2 mb-3">Callbacks &amp; tasks</h2>
            {tasks.length === 0 ? <p className="muted">Nothing scheduled.</p> : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-2 text-sm">
                    <div>
                      <div>{t.type === "callback" ? "⏰ " : "✅ "}{t.title}</div>
                      <div className="faint">{fmtDateTime(t.due_at, user.timezone)} your time{t.lead_tz && t.lead_tz !== user.timezone ? ` · ${fmtDateTime(t.due_at, t.lead_tz)} theirs` : ""}{manager ? ` · ${t.assignee}` : ""}</div>
                    </div>
                    <form action={completeTaskAction}>
                      <input type="hidden" name="taskId" value={t.id} /><input type="hidden" name="returnTo" value={here} />
                      <button className="btn btn-sm" type="submit">Done</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={createTaskAction} className="mt-4 space-y-2 border-t border-line pt-4">
              <input type="hidden" name="leadId" value={lead.id} />
              <input className="input" name="title" placeholder="e.g. Send portfolio" aria-label="Task title" required />
              <input className="input" type="datetime-local" name="due" aria-label="Due" required />
              <select className="select" name="tz" defaultValue="me" aria-label="Time zone of due time">
                <option value="me">Due time is in my time zone</option>
                {lead.timezone && <option value="lead">Due time is in the lead&apos;s zone ({lead.timezone})</option>}
              </select>
              {manager && (
                <select className="select" name="assignee" defaultValue={user.id} aria-label="Assign to">
                  {team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              )}
              <button className="btn" type="submit">Add task</button>
            </form>
          </section>

          <section className="card card-pad" aria-labelledby="deal">
            <h2 id="deal" className="h2 mb-3">Deal &amp; meetings</h2>
            {deal ? (
              <p className="text-sm">Open deal: <Link className="text-copper-light underline" href={`/deals/${deal.id}`}>{deal.title}</Link> · {money(deal.value)}</p>
            ) : !dnc && (
              <form action={createDealAction} className="grid gap-2">
                <input type="hidden" name="leadId" value={lead.id} />
                <select className="select" name="service" defaultValue="" aria-label="Service">
                  <option value="">Service…</option>{optionLabels(user.org_id, "service").map((s) => <option key={s}>{s}</option>)}
                </select>
                <input className="input" name="value" inputMode="decimal" placeholder="Value ($)" aria-label="Deal value" />
                <button className="btn" type="submit">Open a deal</button>
              </form>
            )}
            {meetings.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {meetings.map((m) => (
                  <li key={m.id}>
                    <div>📅 {fmtDateTime(m.scheduled_at, lead.timezone ?? user.timezone)} <span className="faint">(their time)</span> · <span className="badge badge-slate">{m.outcome.replace("_", " ")}</span></div>
                    <div className="faint">{fmtDateTime(m.scheduled_at, user.timezone)} your time</div>
                  </li>
                ))}
              </ul>
            )}
            {!dnc && (
              <form action={scheduleMeetingAction} className="mt-4 space-y-2 border-t border-line pt-4">
                <input type="hidden" name="leadId" value={lead.id} />
                <label className="lbl" htmlFor="meet-at">Book a meeting (lead&apos;s time{lead.timezone ? `, ${lead.timezone}` : ""})</label>
                <input id="meet-at" className="input" type="datetime-local" name="at" required />
                <input className="input" type="url" name="zoom_link" placeholder="Zoom link" aria-label="Zoom link" />
                <input className="input" name="attendees" placeholder="Who attends" aria-label="Attendees" />
                {manager && (
                  <select className="select" name="owner" defaultValue={user.id} aria-label="Closer / owner">
                    {team.map((u) => <option key={u.id} value={u.id}>Closer: {u.name}</option>)}
                  </select>
                )}
                <button className="btn" type="submit">Book meeting</button>
              </form>
            )}
          </section>

          {lead.email && !dnc && (
            <section className="card card-pad" aria-labelledby="email">
              <h2 id="email" className="h2 mb-3">Email {lead.email}</h2>
              {lead.email_optout ? <p className="muted">This contact opted out of email.</p> : (
                <>
                  <form className="mb-3 flex gap-2">
                    <select className="select" name="tpl" defaultValue={tpl?.id ?? ""} aria-label="Template">
                      <option value="">Choose a template…</option>
                      {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button className="btn" type="submit">Use</button>
                  </form>
                  <form action={sendEmailAction} className="space-y-2">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input className="input" name="subject" defaultValue={subject} placeholder="Subject" aria-label="Subject" required />
                    <textarea className="textarea min-h-40" name="body" defaultValue={body} placeholder="Message" aria-label="Message" required />
                    <p className="faint">A sender identity, postal address and opt-out line are added automatically (CAN-SPAM). One-to-one only.</p>
                    {!emailConfigured() && <p className="faint text-warn">No email provider is configured — sending saves a draft on the timeline only.</p>}
                    <button className="btn btn-primary" type="submit">Send email</button>
                  </form>
                </>
              )}
              <form action={toggleOptoutAction} className="mt-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <button className="btn btn-ghost btn-sm text-soft" type="submit">{lead.email_optout ? "Remove email opt-out" : "They asked to stop emails"}</button>
              </form>
            </section>
          )}

          <section className="card card-pad" aria-labelledby="details">
            <h2 id="details" className="h2 mb-3">Details</h2>
            <form action={updateLeadAction} className="grid gap-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <Field label="Business name"><input className="input" name="business_name" defaultValue={lead.business_name} required /></Field>
              <Field label="Owner / contact"><input className="input" name="contact_name" defaultValue={lead.contact_name ?? ""} /></Field>
              <Field label="Email"><input className="input" type="email" name="email" defaultValue={lead.email ?? ""} /></Field>
              <Field label="Website"><input className="input" name="website" defaultValue={lead.website ?? ""} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City"><input className="input" name="city" defaultValue={lead.city ?? ""} /></Field>
                <Field label="State">
                  <select className="select" name="state" defaultValue={lead.state ?? ""}>
                    <option value="">—</option>
                    {Object.entries(STATE_NAMES).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Time zone" hint={lead.tz_approx ? "Approximate (state spans two zones) — calls are limited to a safer window until set exactly." : undefined}>
                <select className="select" name="timezone" defaultValue={lead.tz_approx ? "auto" : (lead.timezone ?? "auto")}>
                  <option value="auto">Auto (from state / area code)</option>
                  {ALL_TIMEZONES.slice(0, 7).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Niche"><select className="select" name="niche" defaultValue={lead.niche ?? ""}><option value="">—</option>
                  {[...new Set([...optionLabels(user.org_id, "niche"), ...(lead.niche ? [lead.niche] : [])])].map((n) => <option key={n}>{n}</option>)}</select></Field>
                <Field label="Source"><select className="select" name="source" defaultValue={lead.source ?? ""}><option value="">—</option>
                  {[...new Set([...optionLabels(user.org_id, "source"), ...(lead.source ? [lead.source] : [])])].map((n) => <option key={n}>{n}</option>)}</select></Field>
                <Field label="Google rating"><input className="input" name="google_rating" inputMode="decimal" defaultValue={lead.google_rating ?? ""} /></Field>
                <Field label="Google reviews"><input className="input" name="google_reviews" inputMode="numeric" defaultValue={lead.google_reviews ?? ""} /></Field>
              </div>
              <CustomFieldInputs fields={fields} values={custom} />
              <button className="btn btn-primary" type="submit">Save details</button>
            </form>

            {!dnc && (
              <form action={setStatusAction} className="mt-4 flex gap-2 border-t border-line pt-4">
                <input type="hidden" name="leadId" value={lead.id} />
                <select className="select" name="status" defaultValue={lead.status} aria-label="Status">
                  {LEAD_STATUSES.filter((s) => s.value !== "dnc").map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button className="btn" type="submit">Set status</button>
              </form>
            )}
            {manager && (
              <form action={reassignAction} className="mt-3 flex gap-2">
                <input type="hidden" name="leadId" value={lead.id} />
                <select className="select" name="assigned_to" defaultValue={lead.assigned_to ?? ""} aria-label="Assign to caller">
                  <option value="">Unassigned</option>
                  {team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <button className="btn" type="submit">Reassign</button>
              </form>
            )}
            <p className="faint mt-4">Created {fmtDateTime(lead.created_at, user.timezone)} · Last call {lead.last_called_at ? fmtDateTime(lead.last_called_at, user.timezone) : "never"} · {lead.attempts} attempt{lead.attempts === 1 ? "" : "s"}</p>
          </section>
        </div>
      </div>
    </>
  );
}
