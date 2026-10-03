import { requireUser, isManager } from "@/lib/auth";
import { listScripts } from "@/lib/scripts";
import { optionLabels } from "@/lib/settings";
import { deleteScriptAction, saveScriptAction } from "@/app/actions/content";
import { Field, Flash, PageHeader, sp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ScriptsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const manager = isManager(user);
  const scripts = listScripts(user.org_id);
  const niches = optionLabels(user.org_id, "niche");
  const openings = scripts.filter((s) => s.kind === "opening");
  const objections = scripts.filter((s) => s.kind === "objection");

  const editor = (s?: (typeof scripts)[number]) => (
    <form key={s?.id ?? "new"} action={saveScriptAction} className="space-y-3">
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Type">
          <select className="select" name="kind" defaultValue={s?.kind ?? "opening"}><option value="opening">Opening script</option><option value="objection">Objection answer</option></select>
        </Field>
        <Field label="Niche"><select className="select" name="niche" defaultValue={s?.niche ?? ""}><option value="">All niches (default)</option>{niches.map((n) => <option key={n}>{n}</option>)}</select></Field>
        <Field label="Title / objection"><input className="input" name="title" defaultValue={s?.title ?? ""} required /></Field>
      </div>
      <Field label="Script" hint="Placeholders: {{contact_name}} {{business_name}} {{caller_name}} {{niche}} {{city}} {{reviews}}">
        <textarea className="textarea min-h-28" name="body" defaultValue={s?.body ?? ""} required />
      </Field>
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm" type="submit">{s ? "Save" : "Add script"}</button>
        {s && <button className="btn btn-danger btn-sm" type="submit" formAction={deleteScriptAction} formNoValidate>Delete</button>}
      </div>
    </form>
  );

  return (
    <>
      <PageHeader title="Scripts & objection handling" subtitle="The opening script for the lead's niche appears beside the lead in My Queue, with ready answers to common objections." />
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      {[{ title: "Opening scripts", list: openings }, { title: "Objections", list: objections }].map((g) => (
        <section key={g.title} className="mb-8">
          <h2 className="h2 mb-3">{g.title}</h2>
          <div className="space-y-3">
            {g.list.map((s) => manager ? (
              <details key={s.id} className="card card-pad">
                <summary className="cursor-pointer font-medium">{s.title} <span className="badge badge-slate ml-2">{s.niche ?? "All niches"}</span></summary>
                <div className="mt-4">{editor(s)}</div>
              </details>
            ) : (
              <div key={s.id} className="card card-pad">
                <div className="font-medium">{s.title} <span className="badge badge-slate ml-2">{s.niche ?? "All niches"}</span></div>
                <p className="muted mt-2 whitespace-pre-wrap">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
      {manager && (
        <section className="card card-pad max-w-3xl">
          <h2 className="h2 mb-3">Add a script</h2>
          {editor()}
        </section>
      )}
    </>
  );
}
