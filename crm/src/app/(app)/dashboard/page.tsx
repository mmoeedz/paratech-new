import Link from "next/link";
import { requireUser, isManager } from "@/lib/auth";
import { byCaller, funnel, pipelineSummary } from "@/lib/reports";
import { dayBounds, fmtDateTime } from "@/lib/time";
import { workableLeadIds } from "@/lib/queue";
import { listMeetings } from "@/lib/meetings";
import { openTasksFor } from "@/lib/tasks";
import { get } from "@/lib/db";
import { Flash, PageHeader, Stat, money, pct, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const manager = isManager(user);
  const today = dayBounds(new Date(), user.timezone);
  const filters = { from: today.start.toISOString(), to: today.end.toISOString(), userId: manager ? undefined : user.id };
  const f = funnel(user.org_id, filters);
  const callbacksDone = byCaller(user.org_id, filters).reduce((a, c) => a + c.callbacks_done, 0);
  const tasks = openTasksFor(user.org_id, user.id, user.timezone);
  const meetings = listMeetings(user.org_id, { from: today.start.toISOString(), to: today.end.toISOString(), outcome: "pending", scopeUserId: manager ? undefined : user.id });
  const queue = workableLeadIds(user);
  const pipeline = pipelineSummary(user.org_id, manager ? undefined : user.id);
  const open = pipeline.filter((p) => p.kind === "open");
  const unassigned = manager ? get<{ n: number }>("SELECT COUNT(*) AS n FROM leads WHERE org_id = ? AND assigned_to IS NULL AND status IN ('new','in_progress')", user.org_id)?.n ?? 0 : 0;
  const noZone = manager ? get<{ n: number }>("SELECT COUNT(*) AS n FROM leads WHERE org_id = ? AND timezone IS NULL AND status IN ('new','in_progress')", user.org_id)?.n ?? 0 : 0;
  const unmatched = manager ? get<{ n: number }>("SELECT COUNT(*) AS n FROM calls WHERE org_id = ? AND verified = 'unmatched'", user.org_id)?.n ?? 0 : 0;

  return (
    <>
      <PageHeader title={`Hi ${user.name.split(" ")[0]}`} subtitle={manager ? "Team activity today." : "Your day so far."}>
        <Link className="btn btn-primary" href="/queue">Start calling →</Link>
      </PageHeader>
      <Flash err={sp(q.denied) ? "You don't have access to that page." : undefined} />

      <section className="mb-8" aria-label="Today">
        <h2 className="h2 mb-3">Today</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Calls made" value={f.calls} />
          <Stat label="Conversations" value={f.conversations} sub={`${pct(f.conversations, f.calls)} of calls`} />
          <Stat label="Interested" value={f.interested} tone="ok" />
          <Stat label="Meetings booked" value={f.meetings} tone="ok" />
          <Stat label="Callbacks completed" value={callbacksDone} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card card-pad" aria-label="Your queue">
          <h2 className="h2 mb-3">Ready to call</h2>
          <div className="text-3xl font-semibold tabular-nums">{queue.length}</div>
          <p className="muted mt-1">leads you can dial right now ({queue.filter((r) => r.grp === "callback").length} callbacks due, {queue.filter((r) => r.grp === "new").length} new, {queue.filter((r) => r.grp === "retry").length} retries).</p>
          <div className="mt-4 flex gap-2"><Link className="btn" href="/queue">Open queue</Link><Link className="btn" href="/callbacks">Callbacks</Link></div>
          {(tasks.overdue.length > 0) && <p className="mt-4 text-sm text-bad">{tasks.overdue.length} overdue callback{tasks.overdue.length === 1 ? "" : "s"}/task{tasks.overdue.length === 1 ? "" : "s"}.</p>}
        </section>

        <section className="card card-pad" aria-label="Meetings today">
          <h2 className="h2 mb-3">Meetings today</h2>
          {meetings.length === 0 ? <p className="muted">None scheduled.</p> : (
            <ul className="space-y-2 text-sm">
              {meetings.map((m) => (
                <li key={m.id}><Link className="hover:text-copper-light" href={`/leads/${m.lead_id}`}>{m.business_name}</Link><div className="faint">{fmtDateTime(m.scheduled_at, user.timezone)}{m.owner_name ? ` · ${m.owner_name}` : ""}</div></li>
              ))}
            </ul>
          )}
          <Link className="btn btn-sm mt-4" href="/meetings">All meetings</Link>
        </section>

        <section className="card card-pad" aria-label="Pipeline">
          <h2 className="h2 mb-3">Pipeline</h2>
          <div className="text-3xl font-semibold tabular-nums">{money(open.reduce((a, p) => a + p.value, 0))}</div>
          <p className="muted mt-1">{open.reduce((a, p) => a + p.deals, 0)} open deals</p>
          <ul className="mt-3 space-y-1 text-sm">{open.filter((p) => p.deals > 0).map((p) => <li key={p.stage} className="flex justify-between"><span>{p.stage}</span><span className="tabular-nums text-soft">{p.deals} · {money(p.value)}</span></li>)}</ul>
          <Link className="btn btn-sm mt-4" href="/deals">Open pipeline</Link>
        </section>
      </div>

      {manager && (unassigned > 0 || noZone > 0 || unmatched > 0) && (
        <section className="card card-pad mt-6" aria-label="Needs attention">
          <h2 className="h2 mb-3">Needs attention</h2>
          <ul className="space-y-2 text-sm">
            {unassigned > 0 && <li>⚠️ {unassigned} open lead{unassigned === 1 ? "" : "s"} aren&apos;t assigned to a caller — <Link className="text-copper-light underline" href="/lists">assign a list</Link>.</li>}
            {noZone > 0 && <li>⚠️ {noZone} open lead{noZone === 1 ? "" : "s"} have no time zone, so they&apos;re held back from calling — <Link className="text-copper-light underline" href="/leads?status=new">add a state</Link>.</li>}
            {unmatched > 0 && <li>⚠️ {unmatched} logged call{unmatched === 1 ? "" : "s"} have no matching Zoom record — <Link className="text-copper-light underline" href="/zoom">review</Link>.</li>}
          </ul>
        </section>
      )}
    </>
  );
}
