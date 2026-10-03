import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { nextForCaller } from "@/lib/queue";
import { getPhones } from "@/lib/leads";
import { callWindow } from "@/lib/leads";
import { listOutcomes, getSettings, optionLabels } from "@/lib/settings";
import { recentCalls } from "@/lib/dispositions";
import { scriptsFor } from "@/lib/scripts";
import { renderTemplate } from "@/lib/email";
import { formatPhone } from "@/lib/phone";
import { fmtDateTime } from "@/lib/time";
import { all } from "@/lib/db";
import { CallPanel } from "@/components/CallPanel";
import { CopyButton } from "@/components/CopyButton";
import { LeadClock } from "@/components/LeadClock";
import { Empty, Flash, StatusBadge, sp } from "@/components/ui";
import { skipLeadAction } from "@/app/actions/calls";

export const dynamic = "force-dynamic";

export default async function QueuePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const state = nextForCaller(user);
  const settings = getSettings(user.org_id);
  const total = state.counts.callback + state.counts.new + state.counts.retry;

  const header = (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="h1">My Queue</h1>
        <p className="muted mt-1">One lead at a time — callbacks first, then new leads, then retries.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm" aria-label="Queue summary">
        <span className="badge badge-info">Callbacks due: {state.counts.callback}</span>
        <span className="badge badge-slate">New: {state.counts.new}</span>
        <span className="badge badge-slate">Retries: {state.counts.retry}</span>
        {state.waiting > 0 && <span className="badge badge-warn" title="Assigned to you but outside calling hours, waiting for a retry date, or missing a time zone">Waiting: {state.waiting}</span>}
      </div>
    </div>
  );

  const lead = state.lead;
  if (!lead) {
    return (
      <>
        {header}
        <Flash ok={sp(q.ok)} err={sp(q.err)} />
        <Empty>
          <div className="text-base text-cloud">Nothing to call right now.</div>
          <p className="mt-2">
            {state.waiting > 0
              ? `You have ${state.waiting} lead${state.waiting === 1 ? "" : "s"} waiting — they're outside legal calling hours (${settings.calling_start_hour}:00–${settings.calling_end_hour}:00 their time), scheduled for a later retry, or missing a time zone.`
              : "Ask your team lead to assign you a call list."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link className="btn" href="/leads">My leads</Link>
            <Link className="btn" href="/callbacks">Callbacks</Link>
          </div>
        </Empty>
      </>
    );
  }

  const phones = getPhones(lead.id);
  const outcomes = listOutcomes(user.org_id);
  const history = recentCalls(user.org_id, lead.id, 4);
  const notes = all<{ summary: string; body: string | null; created_at: string; user_name: string | null }>(
    `SELECT a.summary, a.body, a.created_at, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id
     WHERE a.lead_id = ? AND a.type = 'note' ORDER BY a.created_at DESC LIMIT 3`,
    lead.id,
  );
  const { opening, objections } = scriptsFor(user.org_id, lead.niche);
  const render = (t: string) => renderTemplate(t, lead, user);
  const w = callWindow(user.org_id);
  const pendingCallback = all<{ due_at: string; notes: string | null }>(
    "SELECT due_at, notes FROM tasks WHERE lead_id = ? AND type = 'callback' AND done_at IS NULL ORDER BY due_at LIMIT 1", lead.id,
  )[0];
  const groupLabel = { callback: "Callback due", new: "New lead", retry: "Retry" }[state.group!];
  const search = `https://www.google.com/search?q=${encodeURIComponent([lead.business_name, lead.city, lead.state].filter(Boolean).join(" "))}`;

  return (
    <>
      {header}
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="space-y-6">
          <section className="card card-pad" aria-labelledby="lead-name">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="badge badge-copper">{groupLabel}</span>
                  <StatusBadge status={lead.status} />
                  <span className="faint">Attempt {lead.attempts + 1} of {settings.max_attempts}</span>
                </div>
                <h2 id="lead-name" className="text-2xl font-semibold tracking-tight">{lead.business_name}</h2>
                <p className="muted mt-1">
                  {[lead.contact_name && `Contact: ${lead.contact_name}`, lead.niche, [lead.city, lead.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <div className="faint uppercase">Their local time</div>
                <LeadClock tz={lead.timezone} approx={lead.tz_approx === 1} start={w.start} end={w.end} pad={w.approxPad} />
              </div>
            </div>

            <ul className="mt-5 space-y-2" aria-label="Phone numbers">
              {phones.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-elevated px-4 py-3">
                  <div>
                    <span className={`font-mono text-lg tabular-nums ${p.bad ? "text-faint line-through" : ""}`}>{formatPhone(p.phone)}</span>
                    {p.phone_type !== "unknown" && <span className="badge badge-slate ml-2">{p.phone_type}</span>}
                    {p.bad === 1 && <span className="badge badge-bad ml-2">bad: {p.bad_reason}</span>}
                  </div>
                  {!p.bad && <CopyButton text={p.phone.replace("+1", "")} label="Copy number" />}
                </li>
              ))}
            </ul>
            <p className="faint mt-2">Copy the number and dial it in Zoom, then log the outcome here.</p>

            <dl className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              {lead.decision_maker && <div><dt className="faint">Decision-maker</dt><dd>{lead.decision_maker}{lead.best_time ? ` — best at ${lead.best_time}` : ""}</dd></div>}
              {lead.website && <div><dt className="faint">Website</dt><dd><a className="text-copper-light underline" href={/^https?:/i.test(lead.website) ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer noopener">{lead.website}</a></dd></div>}
              {lead.email && <div><dt className="faint">Email</dt><dd>{lead.email}</dd></div>}
              {lead.google_rating !== null && <div><dt className="faint">Google</dt><dd>{lead.google_rating}★ · {lead.google_reviews ?? 0} reviews</dd></div>}
              {lead.source && <div><dt className="faint">Source</dt><dd>{lead.source}</dd></div>}
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <a className="btn btn-sm" href={search} target="_blank" rel="noreferrer noopener">Google this business ↗</a>
              <Link className="btn btn-sm" href={`/leads/${lead.id}`}>Full lead page</Link>
              <form action={skipLeadAction}>
                <input type="hidden" name="leadId" value={lead.id} />
                <button className="btn btn-sm" type="submit" title="Hide this lead for 30 minutes and move on">Skip for now</button>
              </form>
            </div>
          </section>

          {(pendingCallback || history.length > 0 || notes.length > 0) && (
            <section className="card card-pad" aria-labelledby="hist">
              <h2 id="hist" className="h2 mb-3">Previous activity</h2>
              {pendingCallback && (
                <p className="mb-3 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                  Callback scheduled for {fmtDateTime(pendingCallback.due_at, user.timezone)} your time{pendingCallback.notes ? ` — “${pendingCallback.notes}”` : ""}
                </p>
              )}
              <ul className="space-y-3 text-sm">
                {history.map((c) => (
                  <li key={c.id}>
                    <div><span className="font-medium">#{c.attempt_no} {c.outcome_label}</span> <span className="faint">· {c.user_name} · {fmtDateTime(c.called_at, user.timezone)}</span></div>
                    {c.notes && <p className="muted mt-0.5 whitespace-pre-wrap">{c.notes}</p>}
                  </li>
                ))}
                {notes.map((n, i) => (
                  <li key={i}>
                    <div><span className="font-medium">Note</span> <span className="faint">· {n.user_name} · {fmtDateTime(n.created_at, user.timezone)}</span></div>
                    <p className="muted mt-0.5 whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card card-pad" aria-labelledby="script">
            <h2 id="script" className="h2 mb-3">Call script</h2>
            {opening ? (
              <>
                <div className="faint mb-1">{opening.title}</div>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{render(opening.body)}</p>
              </>
            ) : <p className="muted">No opening script yet — add one under Scripts &amp; objections.</p>}
            {objections.length > 0 && (
              <div className="mt-5 space-y-2">
                <div className="h2">Objection handling</div>
                {objections.map((o) => (
                  <details key={o.id} className="rounded-lg border border-line bg-elevated/50 px-4 py-2.5">
                    <summary className="cursor-pointer text-sm font-medium">“{o.title}”</summary>
                    <p className="muted mt-2 whitespace-pre-wrap">{render(o.body)}</p>
                  </details>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="card card-pad h-fit xl:sticky xl:top-6" aria-labelledby="log">
          <h2 id="log" className="h2 mb-4">Log this call</h2>
          <CallPanel
            leadId={lead.id}
            leadTz={lead.timezone}
            userTz={user.timezone}
            outcomes={outcomes.map((o) => ({ key: o.key, label: o.label, action: o.action, color: o.color }))}
            phones={phones.map((p) => ({ phone: p.phone, display: formatPhone(p.phone), bad: p.bad === 1, type: p.phone_type }))}
            deadReasons={optionLabels(user.org_id, "dead_reason")}
            services={optionLabels(user.org_id, "service")}
            maxAttempts={settings.max_attempts}
            attempts={lead.attempts}
            recontactDays={settings.recontact_days}
          />
        </aside>
      </div>
      <p className="sr-only">{total} leads in your queue</p>
    </>
  );
}
