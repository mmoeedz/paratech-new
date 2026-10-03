import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listBatches } from "@/lib/imports";
import { uploadAction } from "@/app/actions/import";
import { Empty, Flash, PageHeader, sp } from "@/components/ui";
import { fmtDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ImportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("admin", "team_lead");
  const q = await searchParams;
  const batches = listBatches(user.org_id);
  return (
    <>
      <PageHeader title="Import leads" subtitle="Upload a CSV or Excel file, match the columns and preview before anything is saved." />
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      {sp(q.batch) && (
        <p className="mb-5 text-sm"><a className="text-copper-light underline" href={`/api/import/${Number(sp(q.batch))}/skipped`}>Download the skipped rows (with reasons) as CSV</a></p>
      )}
      <form action={uploadAction} className="card card-pad max-w-xl space-y-4">
        <div>
          <label className="lbl" htmlFor="file">Lead file (.csv or .xlsx, up to 20,000 rows)</label>
          <input id="file" className="input file:mr-3 file:rounded file:border-0 file:bg-copper file:px-3 file:py-1 file:text-sm file:font-medium file:text-obsidian" type="file" name="file" accept=".csv,.xlsx,text/csv" required />
        </div>
        <ul className="faint list-disc space-y-1 pl-5">
          <li>Duplicates are found by phone number and by business name + place, against existing leads and within the file.</li>
          <li>Numbers on the do-not-call list are skipped; invalid or badly formatted numbers are flagged.</li>
          <li>State and time zone are filled in from the state or the phone&apos;s area code.</li>
        </ul>
        <button className="btn btn-primary" type="submit">Upload &amp; preview</button>
      </form>

      <h2 className="h2 mb-3 mt-10">Recent imports</h2>
      {batches.length === 0 ? <Empty>No imports yet.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Batch</th><th>Source</th><th>When</th><th className="text-right">Rows</th><th className="text-right">Imported</th><th className="text-right">Duplicates</th><th className="text-right">DNC</th><th className="text-right">Invalid</th><th /></tr></thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td><Link className="font-medium hover:text-copper-light" href={`/leads?batch=${b.id}`}>{b.name}</Link><div className="faint">{b.filename} · {b.by}</div></td>
                  <td>{b.source ?? "—"}</td>
                  <td className="faint">{fmtDateTime(b.created_at, user.timezone)}</td>
                  <td className="text-right tabular-nums">{b.total}</td>
                  <td className="text-right tabular-nums text-ok">{b.imported}</td>
                  <td className="text-right tabular-nums">{b.duplicates}</td>
                  <td className="text-right tabular-nums">{b.dnc_skipped}</td>
                  <td className="text-right tabular-nums">{b.invalid}</td>
                  <td>{b.total - b.imported > 0 && <a className="btn btn-sm" href={`/api/import/${b.id}/skipped`}>Skipped CSV</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
