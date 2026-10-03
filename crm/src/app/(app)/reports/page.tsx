import Link from "next/link";
import { requireUser, isManager, listUsers } from "@/lib/auth";
import { byCaller, bySegment, dailyCalls, funnel, pipelineSummary } from "@/lib/reports";
import { resolveRange, RANGE_PRESETS } from "@/lib/range";
import { optionLabels } from "@/lib/settings";
import { all } from "@/lib/db";
import { PageHeader, Stat, money, pct, sp } from "@/components/ui";
import { STATE_NAMES } from "@/lib/geo";

export const dynamic = "force-dynamic";

const dur = (s: number) => (s ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : "—");

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const manager = isManager(user);
  const range = resolveRange(sp(q.range), sp(q.from), sp(q.to), user.timezone);
  const filters = {
    from: range.from.toISOString(), to: range.to.toISOString(),
    userId: manager ? Number(sp(q.user)) || undefined : user.id,
    listId: Number(sp(q.list)) || undefined, niche: sp(q.niche) || undefined,
  };
  const f = funnel(user.org_id, filters);
  const callers = byCaller(user.org_id, filters);
  const niches = bySegment(user.org_id, filters, "niche");
  const states = bySegment(user.org_id, filters, "state");
  const pipeline = pipelineSummary(user.org_id, manager ? undefined : user.id);
  const daily = dailyCalls(user.org_id, filters, user.timezone);
  const maxDay = Math.max(1, ...daily.map((d) => d.calls));
  const lists = manager ? all<{ id: number; name: string }>("SELECT id, name FROM call_lists WHERE org_id = ? ORDER BY created_at DESC", user.org_id) : [];
  const openValue = pipeline.filter((p) => p.kind === "open").reduce((a, p) => a + p.value, 0);

  const preserved = new URLSearchParams();
  for (const k of ["user", "list", "niche"]) if (sp(q[k])) preserved.set(k, sp(q[k]));

  const funnelSteps = [
    { label: "Calls", n: f.calls }, { label: "Conversations", n: f.conversations },
    { label: "Interested", n: f.interested }, { label: "Meetings booked", n: f.meetings }, { label: "Won", n: f.won },
  ];

  return (
    <>
      <PageHeader title="Reports" subtitle={`${range.label}${manager ? "" : " — your numbers"}. Times are in ${user.timezone}.`} />
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Date range">
        {RANGE_PRESETS.map((r) => {
          const qs = new URLSearchParams(preserved); qs.set("range", r.key);
          return <Link key={r.key} href={`?${qs}`} aria-current={range.key === r.key ? "page" : undefined} className={`btn btn-sm ${range.key === r.key ? "!border-copper !bg-copper/15 !text-copper-light" : ""}`}>{r.label}</Link>;
        })}
      </nav>
      <form className="card card-pad mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <input type="hidden" name="range" value="custom" />
        <input className="input" type="date" name="from" defaultValue={range.fromDate} aria-label="From" />
        <input className="input" type="date" name="to" defaultValue={range.toDate} aria-label="To" />
        {manager && (
          <select className="select" name="user" defaultValue={sp(q.user)} aria-label="Caller">
            <option value="">All callers</option>{listUsers(user.org_id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        {manager && (
          <select className="select" name="list" defaultValue={sp(q.list)} aria-label="List">
            <option value="">All lists</option>{lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
        <select className="select" name="niche" defaultValue={sp(q.niche)} aria-label="Niche">
          <option value="">All niches</option>{optionLabels(user.org_id, "niche").map((n) => <option key={n}>{n}</option>)}
        </select>
        <button className="btn btn-primary" type="submit">Apply</button>
      </form>

      <section className="mb-8" aria-label="Conversion funnel">
        <h2 className="h2 mb-3">Conversion funnel</h2>
        <div className="grid gap-3 sm:grid-cols-5">
          {funnelSteps.map((s, i) => (
            <Stat key={s.label} label={s.label} value={s.n} sub={i === 0 ? "attempts" : `${pct(s.n, funnelSteps[i - 1].n)} of ${funnelSteps[i - 1].label.toLowerCase()}`} tone={i === 4 ? "ok" : undefined} />
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat label="Revenue won" value={money(f.revenue)} tone="ok" />
          <Stat label="Open pipeline" value={money(openValue)} />
          <Stat label="Calls → won" value={pct(f.won, f.calls)} />
        </div>
      </section>

      {daily.length > 0 && (
        <section className="card card-pad mb-8" aria-label="Calls per day">
          <h2 className="h2 mb-4">Calls per day</h2>
          <div className="flex h-36 items-end gap-1.5">
            {daily.map((d) => (
              <div key={d.day} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${d.calls} calls, ${d.conversations} conversations`}>
                <div className="w-full rounded-t bg-copper/70 group-hover:bg-copper" style={{ height: Math.max(3, Math.round((d.calls / maxDay) * 100)) }} />
                <span className="faint truncate text-[10px]">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8" aria-label="Team leaderboard">
        <h2 className="h2 mb-3">{manager ? "Team leaderboard" : "You"}</h2>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Caller</th><th className="text-right">Calls</th><th className="text-right">Conversations</th><th className="text-right">Interested</th><th className="text-right">Meetings</th><th className="text-right">Callbacks done</th><th className="text-right">Won</th><th className="text-right">Revenue</th><th className="text-right">Talk time</th></tr></thead>
            <tbody>
              {[...callers].sort((a, b) => b.revenue - a.revenue || b.meetings - a.meetings || b.calls - a.calls).map((c, i) => (
                <tr key={c.user_id}>
                  <td className="font-medium">{manager && i === 0 && c.calls > 0 && "🏆 "}{c.name}</td>
                  <td className="text-right tabular-nums">{c.calls}</td><td className="text-right tabular-nums">{c.conversations}</td>
                  <td className="text-right tabular-nums">{c.interested}</td><td className="text-right tabular-nums">{c.meetings}</td>
                  <td className="text-right tabular-nums">{c.callbacks_done}</td><td className="text-right tabular-nums">{c.won}</td>
                  <td className="text-right tabular-nums">{money(c.revenue)}</td><td className="text-right tabular-nums">{dur(c.talk_sec)}</td>
                </tr>
              ))}
              {callers.length === 0 && <tr><td colSpan={9} className="faint text-center">No callers.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {[{ title: "Niches that convert", rows: niches }, { title: "States that convert", rows: states.map((r) => ({ ...r, label: STATE_NAMES[r.label] ?? r.label })) }].map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h2 className="h2 mb-3">{g.title}</h2>
            <div className="card overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>{g.title.startsWith("Niche") ? "Niche" : "State"}</th><th className="text-right">Leads called</th><th className="text-right">Calls</th><th className="text-right">Talk rate</th><th className="text-right">Interested</th><th className="text-right">Won</th></tr></thead>
                <tbody>
                  {g.rows.slice(0, 12).map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td><td className="text-right tabular-nums">{r.leads}</td><td className="text-right tabular-nums">{r.calls}</td>
                      <td className="text-right tabular-nums">{pct(r.conversations, r.calls)}</td><td className="text-right tabular-nums">{r.interested}</td><td className="text-right tabular-nums">{r.won}</td>
                    </tr>
                  ))}
                  {g.rows.length === 0 && <tr><td colSpan={6} className="faint text-center">No calls in this period.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <section aria-label="Pipeline">
        <h2 className="h2 mb-3">Pipeline value by stage</h2>
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Stage</th><th className="text-right">Deals</th><th className="text-right">Value</th></tr></thead>
            <tbody>{pipeline.map((p) => <tr key={p.stage}><td>{p.stage}</td><td className="text-right tabular-nums">{p.deals}</td><td className="text-right tabular-nums">{money(p.value)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
