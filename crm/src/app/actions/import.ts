"use server";

import { redirect } from "next/navigation";
import { requireRole, validUserId } from "@/lib/auth";
import { commitImport, getStaging, parseSpreadsheet, stageImport, IMPORT_FIELDS, type Mapping, type ImportFieldKey } from "@/lib/imports";
import { audit } from "@/lib/leads";
import { getList } from "@/lib/lists";
import { back, int, str } from "@/lib/form";

export async function uploadAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) back("/import", { err: "Choose a CSV or XLSX file." });
  if (file.size > 20 * 1024 * 1024) back("/import", { err: "That file is over 20 MB." });
  const parsed = await parseSpreadsheet(file);
  if ("error" in parsed) back("/import", { err: parsed.error });
  const id = stageImport(user.org_id, user.id, file.name, parsed.headers, parsed.rows);
  redirect(`/import/${id}`);
}

function mappingFrom(fd: FormData): Mapping {
  const m: Mapping = {};
  for (const f of IMPORT_FIELDS) {
    const v = int(fd, `map_${f.key}`);
    if (v !== null && v >= 0) m[f.key as ImportFieldKey] = v;
  }
  return m;
}

export async function commitAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const id = int(fd, "stagingId");
  const staging = id ? getStaging(user.org_id, user.id, id) : null;
  if (!staging) back("/import", { err: "That upload expired. Upload the file again." });
  const mapping = mappingFrom(fd);
  if (mapping.business_name === undefined || mapping.phone === undefined) {
    back(`/import/${staging.id}`, { err: "Map at least the business name and phone columns." });
  }
  const batchName = str(fd, "batchName");
  if (!batchName) back(`/import/${staging.id}`, { err: "Give this batch a tag, e.g. “Roofers TX – Sept list”." });
  const listChoice = str(fd, "list");
  if (listChoice && listChoice !== "new" && !getList(user.org_id, Number(listChoice))) {
    back(`/import/${staging.id}`, { err: "That call list wasn't found." });
  }
  const res = commitImport(user.org_id, user.id, staging, mapping, {
    batchName,
    source: str(fd, "source") || null,
    niche: str(fd, "niche") || null,
    listId: listChoice && listChoice !== "new" ? Number(listChoice) : null,
    newListName: listChoice === "new" ? str(fd, "newListName") || batchName : null,
    assignTo: validUserId(user.org_id, int(fd, "assignTo")),
  });
  audit(user.org_id, user.id, "import", `batch ${res.batchId}: ${res.counts.ok} imported of ${res.counts.total}`);
  const c = res.counts;
  const msg = `Imported ${c.ok} lead${c.ok === 1 ? "" : "s"}. Skipped: ${c.duplicate} duplicate, ${c.dnc} on do-not-call, ${c.invalid_phone} invalid phone, ${c.missing_name} missing name.`;
  redirect(`/import?ok=${encodeURIComponent(msg)}${res.counts.total - c.ok > 0 ? `&batch=${res.batchId}` : ""}`);
}
