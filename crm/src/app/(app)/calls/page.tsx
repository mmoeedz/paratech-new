import Link from "next/link";
import { requireUser, isManager, listUsers } from "@/lib/auth";
import { queryCalls } from "@/lib/calllog";
import { listOutcomes } from "@/lib/settings";
import { all } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { fmtDateTime } from "@/lib/time";
import { Empty, PageHeader, Pager, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CallLogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const manager = isManager(user);
  const page = Math.max(1, parseInt(sp(q.page) || "1", 10) || 1);
  const f = { userId: Number(sp(q.user)) || undefined, from: sp(q.from), to: sp(q.to), outcome: sp(q.outcome), listId: Number(sp(q.list)) || undefined, q: sp(q.q) };
  const { rows, total } = queryCalls(user, f, page, 50);
  const base = new URLSearchParams();
  for (const [k, v] of Object.entries({ user: sp(q.user), from: f.from, to: f.to, outcome: f.outcome, list: sp(q.list), q: f.q })) if (v) base.set(k, v);
  const lists = all<{ id: number; name: string }>("SELECT id, name FROM call_lists WHERE org_id = ? ORDER BY created_at DESC", user.org_id);

  return (
    <>
      <PageHeader title="Call log" subtitle={manager ? "Every call attempt, from every caller." : "Your call attempts."}>
        <a className="btn" href={`/api/export/calls?${base.toString()}`}>Export CSV</a>
      </PageHeader>
      <form className="card card-pad mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <input className="input lg:col-span-2" name="q" defaultValue={f.q} placeholder="Search business or notes" aria-label="Search" />
        {manager && (
          <select className="select" name="user" defaultValue={sp(q.user)} aria-label="Caller">
            <option value="">All callers</option>{listUsers(user.org_id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <select className="select" name="outcome" defaultValue={f.outcome} aria-label="Outcome">
          <option value="">Any outcome</option>{listOutcomes(user.org_id, true).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <select className="select" name="list" defaultValue={sp(q.list)} aria-label="List">
          <option value="">Any list</option>{lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <input className="input" type="date" name="from" defaultValue={f.from} aria-label="From date" />
        <input className="input" type="date" name="to" defaultValue={f.to} aria-label="To date" />
        <div className="flex gap-2"><button className="btn btn-primary" type="submit">Filter</button><Link className="btn" href="/calls">Reset</Link></div>
      </form>
      {rows.length === 0 ? <Empty>No calls match.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>When</th>{manager && <th>Caller</th>}<th>Lead</th><th>Number</th><th>Outcome</th><th>Notes</th><th className="text-right">Length</th><th>Zoom</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap">{fmtDateTime(c.called_at, user.timezone)}</td>
                  {manager && <td>{c.user_name}</td>}
                  <td><Link className="hover:text-copper-light" href={`/leads/${c.lead_id}`}>{c.business_name}</Link>{c.list_name && <div className="faint">{c.list_name}</div>}</td>
                  <td className="font-mono text-xs">{formatPhone(c.phone)}</td>
                  <td>#{c.attempt_no} {c.outcome_label}</td>
                  <td className="max-w-xs truncate text-soft" title={c.notes ?? ""}>{c.notes}</td>
                  <td className="text-right tabular-nums">{c.duration_sec ? `${Math.floor(c.duration_sec / 60)}:${String(c.duration_sec % 60).padStart(2, "0")}` : "—"}</td>
                  <td>
                    {c.verified === "matched" && <span className="badge badge-ok">verified</span>}
                    {c.verified === "unmatched" && <span className="badge badge-warn">no Zoom record</span>}
                    {c.recording_url && <> <a className="text-copper-light underline" href={c.recording_url} target="_blank" rel="noreferrer noopener">rec</a></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} pageSize={50} total={total} base={base} />
    </>
  );
}
