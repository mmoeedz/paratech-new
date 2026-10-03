import type { CustomField } from "@/lib/fields";
import { Field } from "@/components/ui";

export function CustomFieldInputs({ fields, values }: { fields: CustomField[]; values: Record<string, string> }) {
  return (
    <>
      {fields.map((f) => {
        const name = `cf_${f.key}`;
        const v = values[f.key] ?? "";
        return (
          <Field key={f.id} label={f.label}>
            {f.type === "select" ? (
              <select className="select" name={name} defaultValue={v}>
                <option value="">—</option>
                {(f.options ?? "").split("\n").filter(Boolean).map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : f.type === "yesno" ? (
              <select className="select" name={name} defaultValue={v}>
                <option value="">—</option><option>Yes</option><option>No</option>
              </select>
            ) : (
              <input className="input" name={name} defaultValue={v} type={f.type === "date" ? "date" : "text"} inputMode={f.type === "number" ? "decimal" : undefined} />
            )}
          </Field>
        );
      })}
    </>
  );
}
