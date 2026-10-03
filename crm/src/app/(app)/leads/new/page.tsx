import { requireUser, isManager, listUsers } from "@/lib/auth";
import { optionLabels } from "@/lib/settings";
import { listFields } from "@/lib/fields";
import { createLeadAction } from "@/app/actions/leads";
import { CustomFieldInputs } from "@/components/CustomFieldInputs";
import { Field, Flash, PageHeader, sp } from "@/components/ui";
import { STATE_NAMES } from "@/lib/geo";

export default async function NewLeadPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const callers = isManager(user) ? listUsers(user.org_id) : [];
  return (
    <>
      <PageHeader title="Add a lead" subtitle="State and time zone are filled in automatically from the state or the phone's area code." />
      <Flash err={sp(q.err)} />
      <form action={createLeadAction} className="card card-pad grid max-w-3xl gap-4 sm:grid-cols-2">
        <Field label="Business name *" className="sm:col-span-2"><input className="input" name="business_name" required /></Field>
        <Field label="Owner / contact name"><input className="input" name="contact_name" /></Field>
        <Field label="Email"><input className="input" type="email" name="email" /></Field>
        <Field label="Phone *"><input className="input" name="phone" inputMode="tel" placeholder="(512) 555-1234" required /></Field>
        <Field label="Second phone"><input className="input" name="phone2" inputMode="tel" /></Field>
        <Field label="Website"><input className="input" name="website" placeholder="example.com" /></Field>
        <Field label="City"><input className="input" name="city" /></Field>
        <Field label="State">
          <select className="select" name="state" defaultValue="">
            <option value="">Auto from area code</option>
            {Object.entries(STATE_NAMES).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </Field>
        <Field label="Niche">
          <select className="select" name="niche" defaultValue="">
            <option value="">—</option>
            {optionLabels(user.org_id, "niche").map((n) => <option key={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Lead source">
          <select className="select" name="source" defaultValue="Manual entry">
            {optionLabels(user.org_id, "source").map((n) => <option key={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Google rating"><input className="input" name="google_rating" inputMode="decimal" /></Field>
        <Field label="Google reviews"><input className="input" name="google_reviews" inputMode="numeric" /></Field>
        {callers.length > 0 && (
          <Field label="Assign to">
            <select className="select" name="assigned_to" defaultValue="">
              <option value="">Unassigned</option>
              {callers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
        )}
        <CustomFieldInputs fields={listFields(user.org_id, "lead")} values={{}} />
        <div className="sm:col-span-2"><button className="btn btn-primary" type="submit">Create lead</button></div>
      </form>
    </>
  );
}
