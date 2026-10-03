import Link from "next/link";
import { requireUser, isManager } from "@/lib/auth";
import { listMeetings, type MeetingRow } from "@/lib/meetings";
import { dayBounds, fmtDateTime, tzAbbr } from "@/lib/time";
import { meetingOutcomeAction } from "@/app/actions/meetings";
import { Empty, Flash, PageHeader, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

const VIEWS = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "upcoming", label: "Later" },
  { key: "pending", label: "Needs an outcome" },
  { key: "noshow", label: "No-shows to call back" },
  { key: "all", label: "All" },
] as const;

const BADGE: Record<string, string> = { pending: "badge-info", held: "badge-ok", no_show: "badge-bad", rescheduled: "badge-warn" };

function Row({ m, tz, view }: { m: MeetingRow; tz: string; view: string }) {
  const leadTz = m.lead_tz ?? tz;
  const when = new Date(m.scheduled_at);
  return (
    <tr>
      <td>
        <div className="font-medium">{fmtDateTime(m.scheduled_at, tz)} <span className="faint">{tzAbbr(tz, when)} · you</span></div>
        {leadTz !== tz && <div className="faint">{fmtDateTime(m.scheduled_at, leadTz)} {tzAbbr(leadTz, when)} · them</div>}
      </td>
      <td>
        <Link className="hover:text-copper-light" href={`/leads/${m.lead_id}`}>{m.business_name}</Link>
        {m.contact_name && <div className="faint">{m.contact_name}</div>}
      </td>
      <td>
        {m.zoom_link ? <a className="text-copper-light underline" href={m.zoom_link} target="_blank" rel="noreferrer noopener">Join Zoom ↗</a> : <span className="faint">No link</span>}
        {m.attendees && <div className="faint">{m.attendees}</div>}
      </td>
      <td>{m.owner_name ?? "—"}</td>
      <td><span className={`badge ${BADGE[m.outcome]}`}>{m.outcome.replace("_", " ")}</span></td>
      <td>
        {m.outcome === "pending" && (
          <div className="flex flex-wrap items-center gap-1.5">
            {(["held", "no_show"] as const).map((o) => (
              <form key={o} action={meetingOutcomeAction}>
                <input type="hidden" name="meetingId" value={m.id} /><input type="hidden" name="view" value={view} /><input type="hidden" name="outcome" value={o} />
                <button className="btn btn-sm" type="submit">{o === "held" ? "Held" : "No-show"}</button>
              </form>
            ))}
            <details className="relative">
              <summary className="btn btn-sm cursor-pointer list-none">Reschedule</summary>
              <form action={meetingOutcomeAction} className="card card-pad absolute right-0 z-10 mt-1 w-64 space-y-2 shadow-lg">
                <input type="hidden" name="meetingId" value={m.id} /><input type="hidden" name="view" value={view} /><input type="hidden" name="outcome" value="rescheduled" />
                <label className="lbl" htmlFor={`re-${m.id}`}>New time ({leadTz})</label>
                <input id={`re-${m.id}`} className="input" type="datetime-local" name="newAt" required />
                <button className="btn btn-primary btn-sm" type="submit">Reschedule</button>
              </form>
            </details>
          </div>
        )}
      </td>
    </tr>
  );
}

export default async function MeetingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const view = VIEWS.some((v) => v.key === sp(q.view)) ? sp(q.view) : "today";
  const scope = isManager(user) ? undefined : user.id;
  const today = dayBounds(new Date(), user.timezone);
  const tomorrow = dayBounds(new Date(), user.timezone, 1);
  const nowIso = new Date().toISOString();

  let rows: MeetingRow[];
  if (view === "today") rows = listMeetings(user.org_id, { from: today.start.toISOString(), to: today.end.toISOString(), scopeUserId: scope });
  else if (view === "tomorrow") rows = listMeetings(user.org_id, { from: tomorrow.start.toISOString(), to: tomorrow.end.toISOString(), scopeUserId: scope });
  else if (view === "upcoming") rows = listMeetings(user.org_id, { from: tomorrow.end.toISOString(), outcome: "pending", scopeUserId: scope });
  else if (view === "pending") rows = listMeetings(user.org_id, { to: nowIso, outcome: "pending", scopeUserId: scope });
  else if (view === "noshow") rows = listMeetings(user.org_id, { outcome: "no_show", scopeUserId: scope }).reverse();
  else rows = listMeetings(user.org_id, { scopeUserId: scope }).reverse();

  return (
    <>
      <PageHeader title="Meetings" subtitle="Booked appointments, shown in both your time and the lead's. Every meeting needs an outcome." />
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Meeting views">
        {VIEWS.map((v) => (
          <Link key={v.key} href={`/meetings?view=${v.key}`} aria-current={v.key === view ? "page" : undefined}
            className={`btn btn-sm ${v.key === view ? "!border-copper !bg-copper/15 !text-copper-light" : ""}`}>{v.label}</Link>
        ))}
      </nav>
      {rows.length === 0 ? <Empty>No meetings in this view.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>When</th><th>Lead</th><th>Zoom / attendees</th><th>Owner</th><th>Outcome</th><th /></tr></thead>
            <tbody>{rows.map((m) => <Row key={m.id} m={m} tz={user.timezone} view={view} />)}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
