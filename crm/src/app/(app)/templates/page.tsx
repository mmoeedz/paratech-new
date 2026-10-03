import { requireUser, isManager } from "@/lib/auth";
import { listTemplates, TEMPLATE_VARS } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { deleteTemplateAction, saveTemplateAction } from "@/app/actions/content";
import { Field, Flash, PageHeader, sp } from "@/components/ui";
import { emailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const manager = isManager(user);
  const templates = listTemplates(user.org_id);
  const s = getSettings(user.org_id);

  const editor = (t?: (typeof templates)[number]) => (
    <form key={t?.id ?? "new"} action={saveTemplateAction} className="space-y-3">
      {t && <input type="hidden" name="id" value={t.id} />}
      <Field label="Template name"><input className="input" name="name" defaultValue={t?.name ?? ""} required /></Field>
      <Field label="Subject"><input className="input" name="subject" defaultValue={t?.subject ?? ""} required /></Field>
      <Field label="Message"><textarea className="textarea min-h-40" name="body" defaultValue={t?.body ?? ""} required /></Field>
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm" type="submit">{t ? "Save" : "Add template"}</button>
        {t && <button className="btn btn-danger btn-sm" type="submit" formAction={deleteTemplateAction} formNoValidate>Delete</button>}
      </div>
    </form>
  );

  return (
    <>
      <PageHeader title="Email templates" subtitle="Used for one-to-one follow-ups after a call. Send from a lead's page; every email is logged on its timeline." />
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      <div className="mb-6 card card-pad text-sm space-y-1">
        <p>Placeholders: {TEMPLATE_VARS.map((v) => <code key={v} className="mr-2 rounded bg-elevated px-1.5 py-0.5 text-copper-light">{`{{${v}}}`}</code>)}</p>
        <p className="muted">Compliance (CAN-SPAM): your company name, postal address and an opt-out line are added to every email automatically.
          {!s.company_address.trim() && <span className="text-warn"> Your postal address isn&apos;t set yet — emails can&apos;t be sent until it is (Settings → General).</span>}
          {!emailConfigured() && <span className="text-warn"> No email provider key is configured, so sending only saves a draft.</span>}</p>
        <p className="muted">These are one-to-one emails only — this CRM has no bulk campaigns.</p>
      </div>
      <div className="space-y-3">
        {templates.map((t) => manager ? (
          <details key={t.id} className="card card-pad"><summary className="cursor-pointer font-medium">{t.name}</summary><div className="mt-4">{editor(t)}</div></details>
        ) : (
          <div key={t.id} className="card card-pad"><div className="font-medium">{t.name}</div><div className="faint mt-1">{t.subject}</div><p className="muted mt-2 whitespace-pre-wrap">{t.body}</p></div>
        ))}
      </div>
      {manager && <section className="card card-pad mt-8 max-w-3xl"><h2 className="h2 mb-3">Add a template</h2>{editor()}</section>}
    </>
  );
}
