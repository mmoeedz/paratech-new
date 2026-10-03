"use server";

import { requireRole } from "@/lib/auth";
import { deleteScript, saveScript } from "@/lib/scripts";
import { run, insert } from "@/lib/db";
import { back, int, str } from "@/lib/form";
import { addDnc, audit } from "@/lib/leads";
import { parsePhone, splitPhones } from "@/lib/phone";
import { requireUser } from "@/lib/auth";

export async function saveScriptAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const title = str(fd, "title");
  const body = str(fd, "body");
  if (!title || !body) back("/scripts", { err: "Title and script text are required." });
  const kind = str(fd, "kind") === "objection" ? "objection" : "opening";
  saveScript(user.org_id, { id: int(fd, "id") ?? undefined, niche: str(fd, "niche") || null, kind, title, body });
  back("/scripts", { ok: "Script saved." });
}

export async function deleteScriptAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const id = int(fd, "id");
  if (id) deleteScript(user.org_id, id);
  back("/scripts", { ok: "Script deleted." });
}

export async function saveTemplateAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const name = str(fd, "name");
  const subject = str(fd, "subject");
  const body = str(fd, "body");
  if (!name || !subject || !body) back("/templates", { err: "Name, subject and message are required." });
  const id = int(fd, "id");
  if (id) run("UPDATE email_templates SET name = ?, subject = ?, body = ? WHERE org_id = ? AND id = ?", name, subject, body, user.org_id, id);
  else insert("INSERT INTO email_templates (org_id, name, subject, body) VALUES (?, ?, ?, ?)", user.org_id, name, subject, body);
  back("/templates", { ok: "Template saved." });
}

export async function deleteTemplateAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const id = int(fd, "id");
  if (id) run("DELETE FROM email_templates WHERE org_id = ? AND id = ?", user.org_id, id);
  back("/templates", { ok: "Template deleted." });
}

export async function addDncAction(fd: FormData) {
  const user = await requireUser();
  const scope = str(fd, "scope") === "national" ? "national" : "internal";
  if (scope === "national" && user.role === "caller") back("/dnc", { err: "Only team leads can record national-registry matches." });
  const raw = splitPhones(str(fd, "numbers").replace(/\n/g, ";"));
  let added = 0;
  let existing = 0;
  const bad: string[] = [];
  for (const r of raw) {
    const p = parsePhone(r);
    if (!p.ok) { bad.push(r); continue; }
    if (addDnc(user.org_id, p.e164, { scope, reason: str(fd, "reason") || (scope === "national" ? "National DNC Registry" : "Added manually"), userId: user.id })) added++;
    else existing++;
  }
  audit(user.org_id, user.id, "dnc.add", `${added} added (${scope})`);
  const parts = [`${added} number${added === 1 ? "" : "s"} blocked`];
  if (existing) parts.push(`${existing} already listed`);
  if (bad.length) parts.push(`${bad.length} invalid (${bad.slice(0, 3).join(", ")}${bad.length > 3 ? "…" : ""})`);
  back("/dnc", added || existing ? { ok: parts.join(", ") + "." } : { err: "No valid numbers found." });
}
