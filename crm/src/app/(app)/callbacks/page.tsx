import Link from "next/link";
import { requireUser, isManager, listUsers } from "@/lib/auth";
import { openTasksFor, type TaskRow } from "@/lib/tasks";
import { completeTaskAction, createGeneralTaskAction } from "@/app/actions/tasks";
import { fmtDateTime, tzAbbr } from "@/lib/time";
import { Empty, Field, Flash, PageHeader, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

function Bucket({ title, rows, tone, tz, showWho }: { title: string; rows: TaskRow[]; tone?: "bad" | "info"; tz: string; showWho: boolean }) {
  return (
    <section className="mb-8" aria-label={title}>
      <h2 className={`h2 mb-3 ${tone === "bad" ? "!text-bad" : ""}`}>{title} <span className="faint normal-case">({rows.length})</span></h2>
      {rows.length === 0 ? <Empty>Nothing here.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>What</th><th>Lead</th><th>Due (your time)</th><th>Their time</th>{showWho && <th>Who</th>}<th /></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>{t.type === "callback" ? "⏰ " : "✅ "}{t.title}{t.notes && <div className="faint">{t.notes}</div>}</td>
                  <td>{t.lead_id ? <Link className="hover:text-copper-light" href={`/leads/${t.lead_id}`}>{t.business_name}</Link> : <span className="faint">—</span>}</td>
                  <td className={tone === "bad" ? "text-bad" : ""}>{fmtDateTime(t.due_at, tz)} <span className="faint">{tzAbbr(tz, new Date(t.due_at))}</span></td>
                  <td className="faint">{t.lead_tz ? `${fmtDateTime(t.due_at, t.lead_tz)} ${tzAbbr(t.lead_tz, new Date(t.due_at))}` : "—"}</td>
                  {showWho && <td>{t.assignee_name}</td>}
                  <td className="text-right">
                    <form action={completeTaskAction} className="inline">
                      <input type="hidden" name="taskId" value={t.id} />
                      <button className="btn btn-sm" type="submit">Done</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function CallbacksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const manager = isManager(user);
  const all = manager && sp(q.scope) === "all";
  const { overdue, today, upcoming } = openTasksFor(user.org_id, user.id, user.timezone, { all });
  const team = manager ? listUsers(user.org_id) : [];

  return (
    <>
      <PageHeader title="Callbacks & tasks" subtitle="Callbacks are saved in the lead's time zone and shown in yours. Due callbacks also appear first in My Queue.">
        {manager && <Link className="btn" href={all ? "/callbacks" : "/callbacks?scope=all"}>{all ? "Show mine only" : "Show whole team"}</Link>}
      </PageHeader>
      <Flash ok={sp(q.ok)} err={sp(q.err)} />

      <Bucket title="Overdue" rows={overdue} tone="bad" tz={user.timezone} showWho={all} />
      <Bucket title="Today" rows={today} tz={user.timezone} showWho={all} />
      <Bucket title="Upcoming" rows={upcoming} tz={user.timezone} showWho={all} />

      <form action={createGeneralTaskAction} className="card card-pad grid max-w-3xl items-end gap-3 sm:grid-cols-2">
        <h2 className="h2 sm:col-span-2">New task</h2>
        <Field label="Task" className="sm:col-span-2"><input className="input" name="title" placeholder="Send portfolio / Follow up after proposal" required /></Field>
        <Field label={`Due (your time, ${user.timezone})`}><input className="input" type="datetime-local" name="due" required /></Field>
        <Field label="Lead ID (optional)"><input className="input" name="leadId" inputMode="numeric" placeholder="from the lead page URL" /></Field>
        {manager && (
          <Field label="Assign to">
            <select className="select" name="assignee" defaultValue={user.id}>{team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          </Field>
        )}
        <Field label="Notes" className="sm:col-span-2"><input className="input" name="notes" /></Field>
        <div><button className="btn btn-primary" type="submit">Add task</button></div>
      </form>
    </>
  );
}
