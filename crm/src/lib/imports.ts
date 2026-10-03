import "server-only";
import Papa from "papaparse";
import { toCsv } from "./csv";
import { all, get, insert, run, tx, now } from "./db";
import { createLead, findDuplicate, isBlockedPhone } from "./leads";
import { normalizeState } from "./geo";
import { nameKey, parsePhone, splitPhones } from "./phone";
import { createList } from "./lists";

export const MAX_IMPORT_ROWS = 20_000;

export const IMPORT_FIELDS = [
  { key: "business_name", label: "Business name", required: true, guess: /(business|company|organi[sz]ation|^name$|account|title)/i },
  { key: "contact_name", label: "Owner / contact name", guess: /(contact|owner|first.?name|full.?name|person|decision)/i },
  { key: "phone", label: "Phone", required: true, guess: /(phone|mobile|tel|cell|number)/i },
  { key: "phone2", label: "Phone 2", guess: /(phone.?2|alt|secondary|mobile.?2|other.?phone)/i },
  { key: "email", label: "Email", guess: /e.?mail/i },
  { key: "website", label: "Website", guess: /(website|url|domain|site)/i },
  { key: "city", label: "City", guess: /^city|town/i },
  { key: "state", label: "State", guess: /(^state|province|region)/i },
  { key: "niche", label: "Niche / industry", guess: /(niche|industry|category|sector|type)/i },
  { key: "source", label: "Lead source", guess: /(source|origin)/i },
  { key: "google_rating", label: "Google rating", guess: /(rating|stars)/i },
  { key: "google_reviews", label: "Google review count", guess: /(review)/i },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];
export type Mapping = Partial<Record<ImportFieldKey, number>>; // field -> column index

/** Parse an uploaded CSV / XLSX into a header row + data rows. */
export async function parseSpreadsheet(file: File): Promise<{ headers: string[]; rows: string[][] } | { error: string }> {
  const name = file.name.toLowerCase();
  let table: string[][];
  try {
    if (name.endsWith(".csv") || name.endsWith(".txt") || file.type === "text/csv") {
      const text = (await file.text()).replace(/^﻿/, "");
      const parsed = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
      table = parsed.data.map((r) => r.map((c) => String(c ?? "").trim()));
    } else if (name.endsWith(".xlsx")) {
      const { default: readXlsx } = await import("read-excel-file/node");
      const buf = Buffer.from(await file.arrayBuffer());
      const sheet = await readXlsx(buf);
      table = sheet.map((r) => r.map((c) => (c === null || c === undefined ? "" : c instanceof Date ? c.toISOString() : String(c).trim())));
    } else {
      return { error: "Upload a .csv or .xlsx file (for .xls, save it as .xlsx first)." };
    }
  } catch {
    return { error: "That file couldn't be read. Check that it's a valid CSV or XLSX." };
  }
  table = table.filter((r) => r.some((c) => c !== ""));
  if (table.length < 2) return { error: "The file needs a header row and at least one lead." };
  if (table.length - 1 > MAX_IMPORT_ROWS) return { error: `Files are limited to ${MAX_IMPORT_ROWS.toLocaleString()} rows — split it and import in parts.` };
  const headers = table[0].map((h, i) => h || `Column ${i + 1}`);
  const width = headers.length;
  const rows = table.slice(1).map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ""));
  return { headers, rows };
}

export function stageImport(orgId: number, userId: number, filename: string, headers: string[], rows: string[][]): number {
  return insert(
    "INSERT INTO import_staging (org_id, user_id, filename, headers, rows, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    orgId, userId, filename, JSON.stringify(headers), JSON.stringify(rows), now(),
  );
}

export type Staging = { id: number; filename: string; headers: string[]; rows: string[][] };

export function getStaging(orgId: number, userId: number, id: number): Staging | null {
  const r = get<{ id: number; filename: string; headers: string; rows: string }>(
    "SELECT * FROM import_staging WHERE org_id = ? AND user_id = ? AND id = ?", orgId, userId, id,
  );
  if (!r) return null;
  // Drop stale uploads while we're here.
  run("DELETE FROM import_staging WHERE created_at < ?", new Date(Date.now() - 24 * 3600_000).toISOString());
  return { id: r.id, filename: r.filename, headers: JSON.parse(r.headers), rows: JSON.parse(r.rows) };
}

export function guessMapping(headers: string[]): Mapping {
  const m: Mapping = {};
  const used = new Set<number>();
  // Most specific patterns first so "Phone 2" doesn't get eaten by "Phone".
  const order: ImportFieldKey[] = ["phone2", "email", "website", "google_reviews", "google_rating", "business_name", "contact_name", "phone", "city", "state", "niche", "source"];
  for (const key of order) {
    const f = IMPORT_FIELDS.find((x) => x.key === key)!;
    const idx = headers.findIndex((h, i) => !used.has(i) && f.guess.test(h));
    if (idx >= 0) {
      m[key] = idx;
      used.add(idx);
    }
  }
  return m;
}

export type RowStatus = "ok" | "duplicate" | "dnc" | "invalid_phone" | "missing_name";

export type ClassifiedRow = {
  index: number; // 1-based data row
  status: RowStatus;
  reason?: string;
  business_name: string;
  phones: string[]; // callable E.164 numbers
  invalid: string[]; // raw values that were unusable
  data: Record<string, string>;
};

export type ImportCounts = Record<RowStatus, number> & { total: number };

/**
 * Classify every row without writing anything: valid, duplicate (phone or business
 * name — against existing leads and earlier rows in the file), blocked by the
 * do-not-call list, or unusable.
 */
export function classifyRows(orgId: number, staging: Staging, mapping: Mapping): { rows: ClassifiedRow[]; counts: ImportCounts } {
  const cell = (r: string[], k: ImportFieldKey) => (mapping[k] === undefined ? "" : (r[mapping[k]!] ?? "").trim());
  const seenPhones = new Map<string, number>();
  const seenNames = new Map<string, { state: string; city: string; row: number }[]>();
  const out: ClassifiedRow[] = [];
  const counts: ImportCounts = { total: 0, ok: 0, duplicate: 0, dnc: 0, invalid_phone: 0, missing_name: 0 };

  staging.rows.forEach((r, i) => {
    const data: Record<string, string> = {};
    for (const f of IMPORT_FIELDS) data[f.key] = cell(r, f.key);
    const base = { index: i + 1, business_name: data.business_name, data, phones: [] as string[], invalid: [] as string[] };
    const push = (status: RowStatus, reason?: string, extra: Partial<ClassifiedRow> = {}) => {
      counts[status]++;
      counts.total++;
      out.push({ ...base, status, reason, ...extra });
    };

    if (!data.business_name) return push("missing_name", "No business name");

    const rawPhones = [...splitPhones(data.phone), ...splitPhones(data.phone2)];
    const good: string[] = [];
    const invalid: string[] = [];
    for (const raw of rawPhones) {
      const p = parsePhone(raw);
      if (p.ok) {
        if (!good.includes(p.e164)) good.push(p.e164);
      } else invalid.push(`${raw} (${p.reason})`);
    }
    if (good.length === 0) {
      return push("invalid_phone", rawPhones.length ? `Invalid phone: ${invalid.join(", ")}` : "No phone number", { invalid });
    }

    const allowed = good.filter((p) => !isBlockedPhone(orgId, p));
    if (allowed.length === 0) return push("dnc", "On the do-not-call list", { phones: good, invalid });

    // Duplicate against existing leads…
    const state = normalizeState(data.state) ?? data.state;
    const dbDup = findDuplicate(orgId, { phones: allowed, business_name: data.business_name, state, city: data.city });
    if (dbDup) return push("duplicate", `Already in CRM as "${dbDup.businessName}" (${dbDup.reason})`, { phones: allowed, invalid });

    // …and against earlier rows in this same file.
    const firstPhoneRow = allowed.map((p) => seenPhones.get(p)).find((x) => x !== undefined);
    if (firstPhoneRow !== undefined) return push("duplicate", `Same phone as row ${firstPhoneRow} in this file`, { phones: allowed, invalid });
    const key = nameKey(data.business_name);
    const same = (seenNames.get(key) ?? []).find(
      (s) => (!s.state || !state || s.state.toLowerCase() === state.toLowerCase()) && (!s.city || !data.city || s.city.toLowerCase() === data.city.toLowerCase()),
    );
    if (same) return push("duplicate", `Same business as row ${same.row} in this file`, { phones: allowed, invalid });

    for (const p of allowed) seenPhones.set(p, i + 1);
    seenNames.set(key, [...(seenNames.get(key) ?? []), { state: state ?? "", city: data.city, row: i + 1 }]);
    push("ok", undefined, { phones: allowed, invalid });
  });
  return { rows: out, counts };
}

export type CommitOptions = {
  batchName: string;
  source: string | null;
  niche: string | null;
  listId: number | null;
  newListName: string | null;
  assignTo: number | null;
};

export type CommitResult = { batchId: number; listId: number | null; counts: ImportCounts };

export function commitImport(orgId: number, userId: number, staging: Staging, mapping: Mapping, opts: CommitOptions): CommitResult {
  const { rows, counts } = classifyRows(orgId, staging, mapping);
  return tx(() => {
    let listId = opts.listId;
    if (!listId && opts.newListName?.trim()) {
      listId = createList(orgId, userId, { name: opts.newListName, niche: opts.niche });
    }
    const batchId = insert(
      `INSERT INTO import_batches (org_id, name, source, filename, created_by, created_at, total, imported, duplicates, dnc_skipped, invalid)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      orgId, opts.batchName.trim(), opts.source, staging.filename, userId, now(),
      counts.total, counts.duplicate, counts.dnc, counts.invalid_phone + counts.missing_name,
    );

    const skipped: { row: number; reason: string; data: Record<string, string> }[] = [];
    let imported = 0;
    for (const r of rows) {
      if (r.status !== "ok") {
        skipped.push({ row: r.index, reason: r.reason ?? r.status, data: r.data });
        continue;
      }
      const num = (v: string) => (v && !isNaN(Number(v.replace(/,/g, ""))) ? Number(v.replace(/,/g, "")) : null);
      const res = createLead(
        orgId,
        {
          business_name: r.business_name,
          contact_name: r.data.contact_name,
          phones: r.phones,
          email: r.data.email,
          website: r.data.website,
          city: r.data.city,
          state: r.data.state,
          niche: r.data.niche || opts.niche,
          source: r.data.source || opts.source,
          google_rating: num(r.data.google_rating),
          google_reviews: num(r.data.google_reviews) === null ? null : Math.round(num(r.data.google_reviews)!),
          list_id: listId,
          batch_id: batchId,
          assigned_to: opts.assignTo,
        },
        userId,
        { allowDuplicate: true },
      );
      if (res.ok) imported++;
      else skipped.push({ row: r.index, reason: res.error, data: r.data });
    }
    run("UPDATE import_batches SET imported = ?, skipped = ? WHERE id = ?", imported, JSON.stringify(skipped.slice(0, 20_000)), batchId);
    run("DELETE FROM import_staging WHERE org_id = ? AND id = ?", orgId, staging.id);
    return { batchId, listId, counts: { ...counts, ok: imported } };
  });
}

export const listBatches = (orgId: number) =>
  all<{ id: number; name: string; source: string | null; filename: string | null; created_at: string; total: number; imported: number; duplicates: number; dnc_skipped: number; invalid: number; by: string | null }>(
    `SELECT b.id, b.name, b.source, b.filename, b.created_at, b.total, b.imported, b.duplicates, b.dnc_skipped, b.invalid, u.name AS by
     FROM import_batches b LEFT JOIN users u ON u.id = b.created_by WHERE b.org_id = ? ORDER BY b.created_at DESC LIMIT 30`,
    orgId,
  );

export function skippedCsv(orgId: number, batchId: number): string | null {
  const b = get<{ skipped: string | null }>("SELECT skipped FROM import_batches WHERE org_id = ? AND id = ?", orgId, batchId);
  if (!b?.skipped) return null;
  const list = JSON.parse(b.skipped) as { row: number; reason: string; data: Record<string, string> }[];
  const cols = IMPORT_FIELDS.map((f) => f.key);
  return toCsv(["row", "reason", ...cols], list.map((s) => [s.row, s.reason, ...cols.map((c) => s.data[c] ?? "")]));
}
