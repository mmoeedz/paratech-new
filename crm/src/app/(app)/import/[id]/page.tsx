import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole, listUsers } from "@/lib/auth";
import { classifyRows, getStaging, guessMapping, IMPORT_FIELDS, type ImportFieldKey, type Mapping } from "@/lib/imports";
import { optionLabels } from "@/lib/settings";
import { all } from "@/lib/db";
import { commitAction } from "@/app/actions/import";
import { Field, Flash, PageHeader, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  ok: { text: "Ready", cls: "badge-ok" },
  duplicate: { text: "Duplicate", cls: "badge-warn" },
  dnc: { text: "Do not call", cls: "badge-bad" },
  invalid_phone: { text: "Invalid phone", cls: "badge-bad" },
  missing_name: { text: "No name", cls: "badge-bad" },
};

export default async function ImportPreviewPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("admin", "team_lead");
  const { id } = await params;
  const q = await searchParams;
  const staging = getStaging(user.org_id, user.id, Number(id));
  if (!staging) notFound();

  // Mapping comes from the query string once the user has adjusted it; otherwise guess from headers.
  const mapping: Mapping = {};
  const guessed = guessMapping(staging.headers);
  for (const f of IMPORT_FIELDS) {
    const given = q[`map_${f.key}`];
    const idx = given === undefined ? guessed[f.key] : Number(sp(given));
    if (idx !== undefined && Number.isInteger(idx) && idx >= 0 && idx < staging.headers.length) mapping[f.key as ImportFieldKey] = idx;
  }
  const mapped = mapping.business_name !== undefined && mapping.phone !== undefined;
  const result = mapped ? classifyRows(user.org_id, staging, mapping) : null;
  const callers = listUsers(user.org_id);
  const lists = all<{ id: number; name: string }>("SELECT id, name FROM call_lists WHERE org_id = ? AND archived = 0 ORDER BY created_at DESC", user.org_id);
  const defaultBatch = staging.filename.replace(/\.[^.]+$/, "");
  const problems = result?.rows.filter((r) => r.status !== "ok").slice(0, 100) ?? [];

  return (
    <>
      <PageHeader title="Match columns & preview" subtitle={`${staging.filename} — ${staging.rows.length.toLocaleString()} rows`}>
        <Link className="btn" href="/import">Cancel</Link>
      </PageHeader>
      <Flash err={sp(q.err)} />

      <form method="get" className="card card-pad mb-6" aria-label="Column mapping">
        <h2 className="h2 mb-3">1. Which column is which?</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IMPORT_FIELDS.map((f) => (
            <Field key={f.key} label={`${f.label}${"required" in f && f.required ? " *" : ""}`}>
              <select className="select" name={`map_${f.key}`} defaultValue={String(mapping[f.key as ImportFieldKey] ?? -1)}>
                <option value="-1">— don&apos;t import —</option>
                {staging.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
              </select>
            </Field>
          ))}
        </div>
        <button className="btn mt-4" type="submit">Update preview</button>
      </form>

      {!mapped ? (
        <p className="muted">Map the business name and phone columns to see the preview.</p>
      ) : result && (
        <>
          <section className="mb-6" aria-label="Preview summary">
            <h2 className="h2 mb-3">2. Preview</h2>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {([["total", "Rows"], ["ok", "Will import"], ["duplicate", "Duplicates"], ["dnc", "Do not call"], ["invalid_phone", "Invalid phone"], ["missing_name", "No name"]] as const).map(([k, label]) => (
                <div key={k} className="card card-pad">
                  <div className="faint uppercase">{label}</div>
                  <div className={`text-2xl font-semibold tabular-nums ${k === "ok" ? "text-ok" : ""}`}>{result.counts[k]}</div>
                </div>
              ))}
            </div>
            <div className="card mt-4 overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Row</th><th>Business</th><th>Phone(s)</th><th>Result</th></tr></thead>
                <tbody>
                  {result.rows.slice(0, 8).map((r) => (
                    <tr key={r.index}>
                      <td className="faint">{r.index}</td><td>{r.business_name || "—"}</td>
                      <td className="font-mono text-xs">{(r.phones.length ? r.phones : [r.data.phone]).join(", ")}</td>
                      <td><span className={`badge ${STATUS_LABEL[r.status].cls}`}>{STATUS_LABEL[r.status].text}</span> <span className="faint">{r.reason}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {problems.length > 0 && (
              <details className="card card-pad mt-4">
                <summary className="cursor-pointer text-sm font-medium">Rows that will be skipped ({result.counts.total - result.counts.ok}){problems.length < result.counts.total - result.counts.ok ? " — showing first 100" : ""}</summary>
                <table className="tbl mt-3">
                  <tbody>
                    {problems.map((r) => (
                      <tr key={r.index}><td className="faint">{r.index}</td><td>{r.business_name || "—"}</td><td><span className={`badge ${STATUS_LABEL[r.status].cls}`}>{STATUS_LABEL[r.status].text}</span></td><td className="faint">{r.reason}</td></tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </section>

          <form action={commitAction} className="card card-pad max-w-3xl space-y-4">
            <h2 className="h2">3. Tag it and save</h2>
            <input type="hidden" name="stagingId" value={staging.id} />
            {IMPORT_FIELDS.map((f) => mapping[f.key as ImportFieldKey] !== undefined && (
              <input key={f.key} type="hidden" name={`map_${f.key}`} value={mapping[f.key as ImportFieldKey]} />
            ))}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Batch tag *" hint="e.g. “Roofers TX – Sept list”"><input className="input" name="batchName" defaultValue={defaultBatch} required /></Field>
              <Field label="Lead source">
                <select className="select" name="source" defaultValue="">
                  <option value="">Use the file&apos;s column / none</option>
                  {optionLabels(user.org_id, "source").map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Niche (for rows without one)">
                <select className="select" name="niche" defaultValue="">
                  <option value="">—</option>{optionLabels(user.org_id, "niche").map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Put these leads in a call list">
                <select className="select" name="list" defaultValue="new">
                  <option value="new">Create a new list</option>
                  {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  <option value="">No list</option>
                </select>
              </Field>
              <Field label="New list name" hint="Used when “Create a new list” is chosen — defaults to the batch tag.">
                <input className="input" name="newListName" placeholder="e.g. Dentists – Florida" />
              </Field>
              <Field label="Assign to (optional)" hint="Or assign later from the list page, including an even split.">
                <select className="select" name="assignTo" defaultValue="">
                  <option value="">Leave unassigned</option>
                  {callers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
            </div>
            <button className="btn btn-primary" type="submit" disabled={result.counts.ok === 0}>Import {result.counts.ok.toLocaleString()} leads</button>
          </form>
        </>
      )}
    </>
  );
}
