import Link from "next/link";
import { requireUser, isManager, listUsers } from "@/lib/auth";
import { LEAD_STATUSES, listLeads } from "@/lib/leads";
import { optionLabels } from "@/lib/settings";
import { all } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { fmtDate } from "@/lib/time";
import { STATE_NAMES } from "@/lib/geo";
import { Empty, Flash, PageHeader, Pager, StatusBadge, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const page = Math.max(1, parseInt(sp(q.page) || "1", 10) || 1);
  const f = {
    q: sp(q.q), status: sp(q.status), niche: sp(q.niche), state: sp(q.state), assigned: sp(q.assigned),
    listId: parseInt(sp(q.list), 10) || undefined, batchId: parseInt(sp(q.batch), 10) || undefined, page, pageSize: 50,
  };
  const { rows, total } = listLeads(user, f);
  const manager = isManager(user);
  const callers = manager ? listUsers(user.org_id) : [];
  const lists = manager ? all<{ id: number; name: string }>("SELECT id, name FROM call_lists WHERE org_id = ? ORDER BY created_at DESC", user.org_id) : [];
  const base = new URLSearchParams();
  for (const [k, v] of Object.entries({ q: f.q, status: f.status, niche: f.niche, state: f.state, assigned: f.assigned, list: sp(q.list), batch: sp(q.batch) })) if (v) base.set(k, v);

  return (
    <>
      <PageHeader title="Leads" subtitle={manager ? "Every prospect in the CRM." : "The prospects assigned to you."}>
        <Link className="btn btn-primary" href="/leads/new">+ Add lead</Link>
      </PageHeader>
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      <form className="card card-pad mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <input className="input lg:col-span-2" name="q" defaultValue={f.q} placeholder="Search name, phone, email, city…" aria-label="Search leads" />
        <select className="select" name="status" defaultValue={f.status} aria-label="Status">
          <option value="">Any status</option>
          {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="select" name="niche" defaultValue={f.niche} aria-label="Niche">
          <option value="">Any niche</option>
          {optionLabels(user.org_id, "niche").map((n) => <option key={n}>{n}</option>)}
        </select>
        <select className="select" name="state" defaultValue={f.state} aria-label="State">
          <option value="">Any state</option>
          {Object.entries(STATE_NAMES).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
        {manager ? (
          <select className="select" name="assigned" defaultValue={f.assigned} aria-label="Assigned to">
            <option value="">Anyone</option>
            <option value="none">Unassigned</option>
            {callers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        ) : <span />}
        {manager && (
          <select className="select lg:col-span-2" name="list" defaultValue={sp(q.list)} aria-label="Call list">
            <option value="">Any list</option>
            {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
        <div className="flex gap-2 lg:col-span-2">
          <button className="btn btn-primary" type="submit">Filter</button>
          <Link className="btn" href="/leads">Reset</Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <Empty>No leads match. {manager && <>Try <Link className="text-copper-light underline" href="/import">importing a list</Link>.</>}</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Business</th><th>Phone</th><th>Location</th><th>Niche</th><th>Status</th><th className="text-right">Calls</th>{manager && <th>Caller</th>}<th>Updated</th></tr></thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link className="font-medium text-cloud hover:text-copper-light" href={`/leads/${l.id}`}>{l.business_name}</Link>
                    {l.contact_name && <div className="faint">{l.contact_name}</div>}
                  </td>
                  <td className="font-mono tabular-nums">{formatPhone(l.primary_phone)}</td>
                  <td>{[l.city, l.state].filter(Boolean).join(", ") || "—"}</td>
                  <td>{l.niche ?? "—"}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="text-right tabular-nums">{l.attempts}</td>
                  {manager && <td>{l.assignee_name ?? <span className="faint">Unassigned</span>}</td>}
                  <td className="faint">{fmtDate(l.updated_at, user.timezone)}</td>
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
