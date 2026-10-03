import Link from "next/link";
import { requireUser, isManager } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { fmtDateTime } from "@/lib/time";
import { addDncAction } from "@/app/actions/content";
import { Empty, Field, Flash, PageHeader, Pager, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DncPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const manager = isManager(user);
  const page = Math.max(1, parseInt(sp(q.page) || "1", 10) || 1);
  const term = sp(q.q).replace(/\D/g, "");
  const where = `d.org_id = ? ${term ? "AND d.phone LIKE ?" : ""}`;
  const params = term ? [user.org_id, `%${term}%`] : [user.org_id];
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM dnc d WHERE ${where}`, ...params)?.n ?? 0;
  const rows = all<{ id: number; phone: string; scope: string; reason: string | null; marked_at: string; by: string | null; lead_id: number | null; business_name: string | null }>(
    `SELECT d.id, d.phone, d.scope, d.reason, d.marked_at, u.name AS by, d.lead_id, l.business_name
     FROM dnc d LEFT JOIN users u ON u.id = d.marked_by LEFT JOIN leads l ON l.id = d.lead_id
     WHERE ${where} ORDER BY d.marked_at DESC LIMIT 50 OFFSET ?`,
    ...params, (page - 1) * 50,
  );
  const base = new URLSearchParams();
  if (sp(q.q)) base.set("q", sp(q.q));

  return (
    <>
      <PageHeader title="Do-not-call list" subtitle="Blocked numbers are never imported again and never shown in the queue. Entries are permanent and record who added them and when.">
        {manager && (
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page
          <a className="btn" href="/api/export/dnc">Export CSV</a>
        )}
      </PageHeader>
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <form action={addDncAction} className="card card-pad space-y-3">
          <h2 className="h2">Block numbers</h2>
          <Field label="Numbers (one per line, or comma-separated)"><textarea className="textarea" name="numbers" placeholder="(512) 555-1234" required /></Field>
          <Field label="Reason (optional)"><input className="input" name="reason" /></Field>
          {manager && (
            <fieldset>
              <legend className="lbl">Source</legend>
              <label className="mr-4 text-sm"><input type="radio" name="scope" value="internal" defaultChecked className="mr-1.5 accent-copper" />Our own list (someone asked us to stop)</label>
              <label className="text-sm"><input type="radio" name="scope" value="national" className="mr-1.5 accent-copper" />National DNC Registry match</label>
              <p className="faint mt-1">Run your lead file through the registry&apos;s scrub, then paste the registered numbers here. Whether they&apos;re blocked is controlled in Settings.</p>
            </fieldset>
          )}
          <button className="btn btn-danger" type="submit">Block these numbers</button>
        </form>
        <div className="card card-pad text-sm space-y-2">
          <h2 className="h2">How this works</h2>
          <p className="muted">• Choosing <b>Do not call</b> after a call blocks every number on that lead.</p>
          <p className="muted">• Imports skip blocked numbers and tell you how many.</p>
          <p className="muted">• B2B calls to business lines are largely exempt from the National Registry, but many small-business owners use personal cell phones — scrubbing against it is cheap protection.</p>
          <p className="muted">• Calling hours (8am–9pm in the lead&apos;s local time) are enforced automatically by the queue.</p>
        </div>
      </div>
      <form className="mb-4 flex max-w-sm gap-2" role="search"><input className="input" name="q" defaultValue={sp(q.q)} placeholder="Look up a number" aria-label="Look up a number" /><button className="btn" type="submit">Search</button></form>
      {rows.length === 0 ? <Empty>{term ? "That number isn't on the list." : "Nothing blocked yet."}</Empty> : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Number</th><th>Source</th><th>Reason</th><th>Lead</th><th>Marked by</th><th>When</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono">{formatPhone(r.phone)}</td>
                  <td><span className={`badge ${r.scope === "internal" ? "badge-bad" : "badge-warn"}`}>{r.scope === "internal" ? "Internal" : "National registry"}</span></td>
                  <td className="text-soft">{r.reason ?? "—"}</td>
                  <td>{r.lead_id && r.business_name ? <Link className="hover:text-copper-light" href={`/leads/${r.lead_id}`}>{r.business_name}</Link> : "—"}</td>
                  <td>{r.by ?? "—"}</td>
                  <td className="faint">{fmtDateTime(r.marked_at, user.timezone)}</td>
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
