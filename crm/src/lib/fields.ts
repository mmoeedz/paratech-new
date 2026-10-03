import "server-only";
import { all, get, insert, run } from "./db";

export type CustomField = { id: number; entity: "lead" | "deal"; key: string; label: string; type: "text" | "number" | "date" | "select" | "yesno"; options: string | null; sort: number };

export const listFields = (orgId: number, entity?: "lead" | "deal") =>
  all<CustomField>(`SELECT * FROM custom_fields WHERE org_id = ? ${entity ? "AND entity = ?" : ""} ORDER BY entity, sort, id`, ...(entity ? [orgId, entity] : [orgId]));

export function addField(orgId: number, f: { entity: "lead" | "deal"; label: string; type: CustomField["type"]; options?: string }) {
  const base = f.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field";
  let key = base;
  for (let i = 2; get("SELECT 1 FROM custom_fields WHERE org_id = ? AND entity = ? AND key = ?", orgId, f.entity, key); i++) key = `${base}_${i}`;
  insert(
    "INSERT INTO custom_fields (org_id, entity, key, label, type, options, sort) VALUES (?, ?, ?, ?, ?, ?, ?)",
    orgId, f.entity, key, f.label.trim(), f.type, f.type === "select" ? (f.options ?? "").split("\n").map((s) => s.trim()).filter(Boolean).join("\n") : null, 99,
  );
}

export const removeField = (orgId: number, id: number) => run("DELETE FROM custom_fields WHERE org_id = ? AND id = ?", orgId, id);

/** Read `cf_<key>` entries from a form into a clean custom-values object. */
export function customFromForm(fields: CustomField[], fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = fd.get(`cf_${f.key}`);
    if (typeof v !== "string" || !v.trim()) continue;
    if (f.type === "number" && isNaN(Number(v))) continue;
    out[f.key] = v.trim().slice(0, 500);
  }
  return out;
}
