import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { unloggedZoomCalls, unmatchedCalls, verificationReport, zoomBatches } from "@/lib/zoom";
import { zoomReconcileAction, zoomUploadAction } from "@/app/actions/zoom";
import { formatPhone } from "@/lib/phone";
import { fmtDateTime } from "@/lib/time";
import { Empty, Flash, PageHeader, pct, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ZoomPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("admin", "team_lead");
  const q = await searchParams;
  const report = verificationReport(user.org_id);
  const batches = zoomBatches(user.org_id);
  const unmatched = unmatchedCalls(user.org_id, 50);
  const unlogged = unloggedZoomCalls(user.org_id, 50);

  return (
    <>
      <PageHeader title="Zoom call-log sync" subtitle="Check that callers really dialled: compare the calls they logged against Zoom Phone's own call records, and attach recordings to leads." />
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <form action={zoomUploadAction} className="card card-pad space-y-3">
          <h2 className="h2">Upload a Zoom Phone call log</h2>
          <p className="muted">In the Zoom web portal go to <b>Phone → Reports → Call Logs</b>, set the date range, and export as CSV. Calls are matched by caller (their Zoom email), the number dialled, and the time.</p>
          <input className="input file:mr-3 file:rounded file:border-0 file:bg-copper file:px-3 file:py-1 file:text-sm file:font-medium file:text-obsidian" type="file" name="file" accept=".csv,text/csv" required aria-label="Zoom call log CSV" />
          <div className="flex gap-2">
            <button className="btn btn-primary" type="submit">Upload &amp; match</button>
          </div>
          <p className="faint">Each caller&apos;s Zoom email must match their CRM login email, or be set on their profile. A live API sync needs a Zoom Marketplace app created by a Zoom admin (scopes for call logs and recordings) — not required for this CSV workflow.</p>
        </form>
        <div className="card card-pad space-y-3">
          <h2 className="h2">Imported data</h2>
          {batches.length === 0 ? <p className="muted">Nothing uploaded yet.</p> : (
            <ul className="space-y-2 text-sm">
              {batches.map((b, i) => <li key={i}>{b.batch ?? "upload"} — {b.n} calls <span className="faint">({fmtDateTime(b.first, user.timezone)} → {fmtDateTime(b.last, user.timezone)})</span></li>)}
            </ul>
          )}
          <form action={zoomReconcileAction}><button className="btn btn-sm" type="submit">Re-run matching</button></form>
        </div>
      </div>

      <section className="mb-8" aria-label="Verification by caller">
        <h2 className="h2 mb-3">Verification by caller</h2>
        {report.length === 0 ? <Empty>Upload a Zoom log to see how each caller&apos;s logged calls line up with Zoom.</Empty> : (
          <div className="card overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Caller</th><th className="text-right">Logged calls checked</th><th className="text-right">Matched in Zoom</th><th className="text-right">No Zoom record</th><th className="text-right">Match rate</th><th className="text-right">Zoom calls never logged</th></tr></thead>
              <tbody>
                {report.map((r) => (
                  <tr key={r.user_id}>
                    <td className="font-medium">{r.name}</td><td className="text-right tabular-nums">{r.logged}</td>
                    <td className="text-right tabular-nums text-ok">{r.matched}</td>
                    <td className={`text-right tabular-nums ${r.unmatched ? "text-warn" : ""}`}>{r.unmatched}</td>
                    <td className="text-right tabular-nums">{pct(r.matched, r.logged)}</td>
                    <td className="text-right tabular-nums">{r.unlogged_zoom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Logged calls with no Zoom record">
          <h2 className="h2 mb-3">Logged, but no Zoom record</h2>
          {unmatched.length === 0 ? <Empty>None.</Empty> : (
            <div className="card overflow-x-auto"><table className="tbl"><tbody>
              {unmatched.map((c) => (
                <tr key={c.id}><td>{fmtDateTime(c.called_at, user.timezone)}</td><td>{c.user_name}</td><td><Link className="hover:text-copper-light" href={`/leads/${c.lead_id}`}>{c.business_name}</Link></td><td className="font-mono text-xs">{formatPhone(c.phone)}</td></tr>
              ))}
            </tbody></table></div>
          )}
        </section>
        <section aria-label="Zoom calls that were never logged">
          <h2 className="h2 mb-3">Dialled in Zoom, never logged</h2>
          {unlogged.length === 0 ? <Empty>None.</Empty> : (
            <div className="card overflow-x-auto"><table className="tbl"><tbody>
              {unlogged.map((z) => (
                <tr key={z.id}><td>{fmtDateTime(z.started_at, user.timezone)}</td><td>{z.user_name ?? z.caller_email ?? "Unknown"}</td><td className="font-mono text-xs">{formatPhone(z.phone)}</td><td className="faint">{z.duration_sec ? `${z.duration_sec}s` : ""}</td></tr>
              ))}
            </tbody></table></div>
          )}
        </section>
      </div>
    </>
  );
}
