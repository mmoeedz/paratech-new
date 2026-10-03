import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole, listUsers } from "@/lib/auth";
import { getList, listAssignees, listProgress } from "@/lib/lists";
import { optionLabels } from "@/lib/settings";
import { STATE_NAMES } from "@/lib/geo";
import { archiveListAction, assignListAction, moveLeadsToListAction } from "@/app/actions/lists";
import { Field, Flash, PageHeader, ProgressBar, Stat, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ListDetailPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("admin", "team_lead");
  const { id } = await params;
  const q = await searchParams;
  const list = getList(user.org_id, Number(id));
  if (!list) notFound();
  const p = listProgress(user.org_id, { includeArchived: true }).find((x) => x.id === list.id)!;
  const assignees = listAssignees(user.org_id, list.id);
  const callers = listUsers(user.org_id);

  return (
    <>
      <PageHeader title={list.name} subtitle={[list.niche, list.state && STATE_NAMES[list.state]].filter(Boolean).join(" · ") || "Call list"}>
        <Link className="btn" href={`/leads?list=${list.id}`}>View leads</Link>
        <form action={archiveListAction}><input type="hidden" name="listId" value={list.id} /><button className="btn" type="submit">Archive</button></form>
      </PageHeader>
      <Flash ok={sp(q.ok)} err={sp(q.err)} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Total" value={p.total} />
        <Stat label="Called" value={p.called} />
        <Stat label="Remaining" value={p.remaining} />
        <Stat label="Interested" value={p.interested} tone="ok" />
        <Stat label="Dead" value={p.dead} />
        <Stat label="Unassigned" value={p.unassigned} tone={p.unassigned ? "warn" : undefined} />
      </div>
      <div className="mb-8"><ProgressBar done={p.total - p.remaining} total={p.total} /></div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={assignListAction} className="card card-pad space-y-4">
          <h2 className="h2">Assign to callers</h2>
          <input type="hidden" name="listId" value={list.id} />
          <fieldset>
            <legend className="lbl">Callers (several = an even split)</legend>
            <div className="grid gap-1.5">
              {callers.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="callers" value={u.id} className="accent-copper" /> {u.name} <span className="faint">{u.role.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="lbl">Which leads</legend>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="mode" value="unassigned" defaultChecked className="accent-copper" /> Only leads nobody owns yet</label>
            <label className="mt-1 flex items-center gap-2 text-sm"><input type="radio" name="mode" value="all_open" className="accent-copper" /> All open leads (reassign from current callers)</label>
          </fieldset>
          <fieldset>
            <legend className="lbl">How many</legend>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="scope" value="all" defaultChecked className="accent-copper" /> The whole list</label>
            <label className="mt-1 flex items-center gap-2 text-sm"><input type="radio" name="scope" value="part" className="accent-copper" /> Just
              <input className="input !w-24 !py-1" name="count" inputMode="numeric" aria-label="Number of leads" placeholder="50" /> leads</label>
          </fieldset>
          <p className="faint">A lead belongs to one caller at a time, so two callers never get the same business. Leads another caller has open right now are skipped.</p>
          <button className="btn btn-primary" type="submit">Assign</button>
        </form>

        <div className="space-y-6">
          <section className="card card-pad">
            <h2 className="h2 mb-3">Who has what</h2>
            {assignees.length === 0 ? <p className="muted">Nothing assigned yet.</p> : (
              <table className="tbl">
                <thead><tr><th>Caller</th><th className="text-right">Open</th><th className="text-right">Total</th></tr></thead>
                <tbody>{assignees.map((a) => <tr key={a.user_id}><td>{a.name}</td><td className="text-right tabular-nums">{a.open}</td><td className="text-right tabular-nums">{a.total}</td></tr>)}</tbody>
              </table>
            )}
          </section>
          <form action={moveLeadsToListAction} className="card card-pad space-y-3">
            <h2 className="h2">Pull existing leads into this list</h2>
            <input type="hidden" name="listId" value={list.id} />
            <p className="faint">Moves open leads that aren&apos;t in any list yet.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Niche"><select className="select" name="niche" defaultValue={list.niche ?? ""}><option value="">Any</option>{optionLabels(user.org_id, "niche").map((n) => <option key={n}>{n}</option>)}</select></Field>
              <Field label="State"><select className="select" name="state" defaultValue={list.state ?? ""}><option value="">Any</option>{Object.entries(STATE_NAMES).map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></Field>
            </div>
            <button className="btn" type="submit">Move leads in</button>
          </form>
        </div>
      </div>
    </>
  );
}
