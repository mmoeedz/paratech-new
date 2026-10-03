import "server-only";
import { all, get, insert, run } from "./db";

export type Script = { id: number; niche: string | null; kind: "opening" | "objection"; title: string; body: string; sort: number };

export const listScripts = (orgId: number) =>
  all<Script>("SELECT * FROM scripts WHERE org_id = ? ORDER BY kind DESC, COALESCE(niche, ''), sort, id", orgId);

/** Opening script for a niche (falls back to the default), plus every objection that applies. */
export function scriptsFor(orgId: number, niche: string | null) {
  const rows = listScripts(orgId);
  const opening =
    rows.find((s) => s.kind === "opening" && niche && s.niche?.toLowerCase() === niche.toLowerCase()) ??
    rows.find((s) => s.kind === "opening" && !s.niche) ??
    null;
  const objections = rows.filter((s) => s.kind === "objection" && (!s.niche || (niche && s.niche.toLowerCase() === niche.toLowerCase())));
  return { opening, objections };
}

export const getScript = (orgId: number, id: number) => get<Script>("SELECT * FROM scripts WHERE org_id = ? AND id = ?", orgId, id);

export function saveScript(orgId: number, s: { id?: number; niche: string | null; kind: "opening" | "objection"; title: string; body: string }) {
  if (s.id) {
    run("UPDATE scripts SET niche = ?, kind = ?, title = ?, body = ? WHERE org_id = ? AND id = ?", s.niche, s.kind, s.title, s.body, orgId, s.id);
  } else {
    insert("INSERT INTO scripts (org_id, niche, kind, title, body, sort) VALUES (?, ?, ?, ?, ?, 99)", orgId, s.niche, s.kind, s.title, s.body);
  }
}

export const deleteScript = (orgId: number, id: number) => run("DELETE FROM scripts WHERE org_id = ? AND id = ?", orgId, id);
