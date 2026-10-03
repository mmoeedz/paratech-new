import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listProgress } from "@/lib/lists";
import { optionLabels } from "@/lib/settings";
import { STATE_NAMES } from "@/lib/geo";
import { createListAction } from "@/app/actions/lists";
import { Empty, Field, Flash, PageHeader, ProgressBar, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ListsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("admin", "team_lead");
  const q = await searchParams;
  const lists = listProgress(user.org_id);
  return (
    <>
      <PageHeader title="Call lists" subtitle="Group leads by niche and state, then assign whole lists (or part of one) to callers." />
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      <form action={createListAction} className="card card-pad mb-8 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="New list name"><input className="input" name="name" placeholder="Dentists – Florida" required /></Field>
        <Field label="Niche">
          <select className="select" name="niche" defaultValue=""><option value="">—</option>{optionLabels(user.org_id, "niche").map((n) => <option key={n}>{n}</option>)}</select>
        </Field>
        <Field label="State">
          <select className="select" name="state" defaultValue=""><option value="">—</option>{Object.entries(STATE_NAMES).map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
        </Field>
        <button className="btn btn-primary" type="submit">Create list</button>
      </form>

      {lists.length === 0 ? <Empty>No lists yet. Create one above, or import a file and it will create one for you.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>List</th><th className="w-48">Progress</th><th className="text-right">Total</th><th className="text-right">Called</th><th className="text-right">Remaining</th><th className="text-right">Interested</th><th className="text-right">Dead</th><th className="text-right">Unassigned</th></tr></thead>
            <tbody>
              {lists.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link className="font-medium hover:text-copper-light" href={`/lists/${l.id}`}>{l.name}</Link>
                    <div className="faint">{[l.niche, l.state && STATE_NAMES[l.state]].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td><ProgressBar done={l.total - l.remaining} total={l.total} /></td>
                  <td className="text-right tabular-nums">{l.total}</td>
                  <td className="text-right tabular-nums">{l.called}</td>
                  <td className="text-right tabular-nums">{l.remaining}</td>
                  <td className="text-right tabular-nums text-ok">{l.interested}</td>
                  <td className="text-right tabular-nums">{l.dead}</td>
                  <td className={`text-right tabular-nums ${l.unassigned ? "text-warn" : ""}`}>{l.unassigned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
