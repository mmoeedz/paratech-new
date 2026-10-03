import "server-only";
import { all, get, insert, run, tx, now } from "./db";
import { resolveZone } from "./geo";
import { nameKey, parsePhone } from "./phone";
import { getSettings } from "./settings";
import { isCallableNow } from "./time";
import type { User } from "./auth";

export type LeadStatus = "new" | "in_progress" | "interested" | "meeting_booked" | "client" | "dead" | "dnc";

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "interested", label: "Interested" },
  { value: "meeting_booked", label: "Meeting booked" },
  { value: "client", label: "Client" },
  { value: "dead", label: "Dead" },
  { value: "dnc", label: "Do not call" },
];

export const statusLabel = (s: string) => LEAD_STATUSES.find((x) => x.value === s)?.label ?? s;

export type Lead = {
  id: number;
  org_id: number;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  timezone: string | null;
  tz_approx: number;
  niche: string | null;
  source: string | null;
  google_rating: number | null;
  google_reviews: number | null;
  status: LeadStatus;
  assigned_to: number | null;
  list_id: number | null;
  batch_id: number | null;
  attempts: number;
  last_called_at: string | null;
  next_action_at: string | null;
  skip_until: string | null;
  locked_by: number | null;
  locked_at: string | null;
  decision_maker: string | null;
  best_time: string | null;
  dead_reason: string | null;
  recontact_at: string | null;
  email_optout: number;
  custom: string;
  created_at: string;
  updated_at: string;
};

export type LeadPhone = {
  id: number;
  lead_id: number;
  phone: string;
  raw: string | null;
  label: string | null;
  phone_type: "mobile" | "landline" | "voip" | "unknown";
  is_primary: number;
  bad: number;
  bad_reason: string | null;
};

export function getLead(orgId: number, id: number): Lead | undefined {
  return get<Lead>("SELECT * FROM leads WHERE org_id = ? AND id = ?", orgId, id);
}

/** Callers only see their own leads; team leads and admins see everything. */
export function canSeeLead(user: User, lead: Pick<Lead, "assigned_to" | "org_id">): boolean {
  if (lead.org_id !== user.org_id) return false;
  return user.role !== "caller" || lead.assigned_to === user.id;
}

export function getPhones(leadId: number): LeadPhone[] {
  return all<LeadPhone>("SELECT * FROM lead_phones WHERE lead_id = ? ORDER BY bad, is_primary DESC, id", leadId);
}

export function addActivity(input: {
  orgId: number; leadId?: number | null; dealId?: number | null; userId?: number | null;
  type: string; summary: string; body?: string | null;
}) {
  insert(
    `INSERT INTO activities (org_id, lead_id, deal_id, user_id, type, summary, body, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.orgId, input.leadId ?? null, input.dealId ?? null, input.userId ?? null,
    input.type, input.summary, input.body ?? null, now(),
  );
}

export function audit(orgId: number, userId: number | null, action: string, detail?: string) {
  run("INSERT INTO audit_log (org_id, user_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)", orgId, userId, action, detail ?? null, now());
}

// ------------------------------------------------------------------ DNC

export function isBlockedPhone(orgId: number, e164: string): boolean {
  const blockNational = getSettings(orgId).block_national_dnc === 1;
  const r = get<{ scope: string }>("SELECT scope FROM dnc WHERE org_id = ? AND phone = ?", orgId, e164);
  if (!r) return false;
  return r.scope === "internal" || blockNational;
}

/**
 * Add a number to the do-not-call list and take it out of rotation on every
 * lead that uses it. A lead with no callable number left becomes "Do not call".
 */
export function addDnc(orgId: number, e164: string, opts: { scope?: "internal" | "national"; reason?: string; leadId?: number | null; userId?: number | null } = {}): boolean {
  const scope = opts.scope ?? "internal";
  const r = run(
    `INSERT OR IGNORE INTO dnc (org_id, phone, scope, reason, lead_id, marked_by, marked_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    orgId, e164, scope, opts.reason ?? null, opts.leadId ?? null, opts.userId ?? null, now(),
  );
  // An internal request outranks an earlier national-registry record.
  if (r.changes === 0 && scope === "internal") {
    run("UPDATE dnc SET scope = 'internal', reason = COALESCE(?, reason), marked_by = ?, marked_at = ? WHERE org_id = ? AND phone = ?", opts.reason ?? null, opts.userId ?? null, now(), orgId, e164);
  }
  if (scope === "national" && getSettings(orgId).block_national_dnc !== 1) return r.changes > 0;

  const affected = all<{ id: number; lead_id: number }>("SELECT id, lead_id FROM lead_phones WHERE org_id = ? AND phone = ?", orgId, e164);
  for (const p of affected) {
    run("UPDATE lead_phones SET bad = 1, bad_reason = 'do not call' WHERE id = ?", p.id);
    refreshLeadCallability(orgId, p.lead_id);
  }
  return r.changes > 0;
}

/** If a lead has no usable phone left, retire it (do-not-call or dead). */
export function refreshLeadCallability(orgId: number, leadId: number) {
  const remaining = get<{ n: number }>("SELECT COUNT(*) AS n FROM lead_phones WHERE lead_id = ? AND bad = 0", leadId);
  if ((remaining?.n ?? 0) > 0) return;
  const lead = getLead(orgId, leadId);
  if (!lead || lead.status === "dnc" || lead.status === "client") return;
  const blocked = get<{ n: number }>("SELECT COUNT(*) AS n FROM lead_phones WHERE lead_id = ? AND bad_reason = 'do not call'", leadId);
  const status = (blocked?.n ?? 0) > 0 ? "dnc" : "dead";
  run(
    "UPDATE leads SET status = ?, dead_reason = COALESCE(dead_reason, ?), locked_by = NULL, locked_at = NULL, updated_at = ? WHERE id = ?",
    status, status === "dnc" ? "Do not call" : "No working number", now(), leadId,
  );
  closeOpenTasks(orgId, leadId);
}

export function closeOpenTasks(orgId: number, leadId: number) {
  run("UPDATE tasks SET done_at = ? WHERE org_id = ? AND lead_id = ? AND done_at IS NULL AND type = 'callback'", now(), orgId, leadId);
}

// ------------------------------------------------------------------ create / duplicates

export type NewLeadInput = {
  business_name: string;
  contact_name?: string | null;
  phones: string[];
  email?: string | null;
  website?: string | null;
  city?: string | null;
  state?: string | null;
  timezone?: string | null;
  niche?: string | null;
  source?: string | null;
  google_rating?: number | null;
  google_reviews?: number | null;
  list_id?: number | null;
  batch_id?: number | null;
  assigned_to?: number | null;
  custom?: Record<string, string>;
};

export type DuplicateHit = { leadId: number; businessName: string; reason: "phone" | "name" };

/** Existing lead that shares a phone number or the same business name + place. */
export function findDuplicate(orgId: number, input: { phones: string[]; business_name: string; state?: string | null; city?: string | null }): DuplicateHit | null {
  for (const p of input.phones) {
    const hit = get<{ id: number; business_name: string }>(
      `SELECT l.id, l.business_name FROM lead_phones p JOIN leads l ON l.id = p.lead_id
       WHERE p.org_id = ? AND p.phone = ? LIMIT 1`,
      orgId, p,
    );
    if (hit) return { leadId: hit.id, businessName: hit.business_name, reason: "phone" };
  }
  const key = nameKey(input.business_name);
  if (key) {
    const candidates = all<{ id: number; business_name: string; state: string | null; city: string | null }>(
      "SELECT id, business_name, state, city FROM leads WHERE org_id = ? AND name_key = ?", orgId, key,
    );
    const st = (input.state ?? "").toLowerCase();
    const city = (input.city ?? "").toLowerCase();
    for (const c of candidates) {
      // Chains share names across places, so only call it a duplicate when the
      // location agrees (or neither side has one).
      const sameState = !st || !c.state || c.state.toLowerCase() === st;
      const sameCity = !city || !c.city || c.city.toLowerCase() === city;
      if (sameState && sameCity) return { leadId: c.id, businessName: c.business_name, reason: "name" };
    }
  }
  return null;
}

export type CreateLeadResult = { ok: true; id: number } | { ok: false; error: string };

export function createLead(orgId: number, input: NewLeadInput, userId: number | null, opts: { allowDuplicate?: boolean } = {}): CreateLeadResult {
  const name = input.business_name.trim();
  if (!name) return { ok: false, error: "Business name is required." };

  const phones: { e164: string; raw: string }[] = [];
  for (const raw of input.phones) {
    const p = parsePhone(raw);
    if (p.ok && !phones.some((x) => x.e164 === p.e164)) phones.push({ e164: p.e164, raw });
  }
  if (phones.length === 0) return { ok: false, error: "At least one valid US phone number is required." };

  const blocked = phones.find((p) => isBlockedPhone(orgId, p.e164));
  if (blocked) return { ok: false, error: "That number is on the do-not-call list." };

  if (!opts.allowDuplicate) {
    const dup = findDuplicate(orgId, { phones: phones.map((p) => p.e164), business_name: name, state: input.state, city: input.city });
    if (dup) return { ok: false, error: `Duplicate of "${dup.businessName}" (same ${dup.reason}).` };
  }

  const zone = resolveZone({ state: input.state, phone: phones[0].e164 });
  const timezone = input.timezone || zone.timezone;
  const approx = input.timezone ? 0 : zone.approx ? 1 : 0;
  const ts = now();

  const id = tx(() => {
    const leadId = insert(
      `INSERT INTO leads (org_id, business_name, contact_name, email, website, city, state, timezone, tz_approx, niche, source,
         google_rating, google_reviews, status, assigned_to, list_id, batch_id, custom, name_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?)`,
      orgId, name, input.contact_name?.trim() || null, input.email?.trim().toLowerCase() || null,
      input.website?.trim() || null, input.city?.trim() || null, zone.state ?? (input.state?.trim() || null),
      timezone ?? null, approx, input.niche?.trim() || null, input.source?.trim() || null,
      input.google_rating ?? null, input.google_reviews ?? null, input.assigned_to ?? null,
      input.list_id ?? null, input.batch_id ?? null, JSON.stringify(input.custom ?? {}), nameKey(name), ts, ts,
    );
    phones.forEach((p, i) =>
      insert(
        "INSERT INTO lead_phones (org_id, lead_id, phone, raw, is_primary, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        orgId, leadId, p.e164, p.raw, i === 0 ? 1 : 0, ts,
      ),
    );
    addActivity({ orgId, leadId, userId, type: "created", summary: "Lead created" });
    return leadId;
  });
  return { ok: true, id };
}

// ------------------------------------------------------------------ listing

export type LeadFilters = {
  q?: string;
  status?: string;
  niche?: string;
  state?: string;
  assigned?: string; // user id | "none"
  listId?: number;
  batchId?: number;
  page?: number;
  pageSize?: number;
};

export type LeadRow = Lead & { assignee_name: string | null; list_name: string | null; primary_phone: string | null };

export function listLeads(user: User, f: LeadFilters): { rows: LeadRow[]; total: number } {
  const where: string[] = ["l.org_id = ?"];
  const params: (string | number)[] = [user.org_id];
  if (user.role === "caller") {
    where.push("l.assigned_to = ?");
    params.push(user.id);
  } else if (f.assigned === "none") {
    where.push("l.assigned_to IS NULL");
  } else if (f.assigned) {
    where.push("l.assigned_to = ?");
    params.push(Number(f.assigned));
  }
  if (f.status) { where.push("l.status = ?"); params.push(f.status); }
  if (f.niche) { where.push("l.niche = ?"); params.push(f.niche); }
  if (f.state) { where.push("l.state = ?"); params.push(f.state); }
  if (f.listId) { where.push("l.list_id = ?"); params.push(f.listId); }
  if (f.batchId) { where.push("l.batch_id = ?"); params.push(f.batchId); }
  if (f.q?.trim()) {
    const q = f.q.trim();
    const digits = q.replace(/\D/g, "");
    const like = `%${q.toLowerCase()}%`;
    if (digits.length >= 4) {
      where.push(`(l.id IN (SELECT lead_id FROM lead_phones WHERE org_id = l.org_id AND phone LIKE ?)
                   OR lower(l.business_name) LIKE ? OR lower(l.contact_name) LIKE ?)`);
      params.push(`%${digits}%`, like, like);
    } else {
      where.push("(lower(l.business_name) LIKE ? OR lower(l.contact_name) LIKE ? OR lower(l.email) LIKE ? OR lower(l.city) LIKE ?)");
      params.push(like, like, like, like);
    }
  }
  const pageSize = f.pageSize ?? 50;
  const offset = ((f.page ?? 1) - 1) * pageSize;
  const w = where.join(" AND ");
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM leads l WHERE ${w}`, ...params)?.n ?? 0;
  const rows = all<LeadRow>(
    `SELECT l.*, u.name AS assignee_name, cl.name AS list_name,
       (SELECT phone FROM lead_phones WHERE lead_id = l.id ORDER BY bad, is_primary DESC, id LIMIT 1) AS primary_phone
     FROM leads l
     LEFT JOIN users u ON u.id = l.assigned_to
     LEFT JOIN call_lists cl ON cl.id = l.list_id
     WHERE ${w} ORDER BY l.updated_at DESC, l.id DESC LIMIT ? OFFSET ?`,
    ...params, pageSize, offset,
  );
  return { rows, total };
}

// ------------------------------------------------------------------ calling hours

export function callWindow(orgId: number) {
  const s = getSettings(orgId);
  return { start: s.calling_start_hour, end: s.calling_end_hour, approxPad: s.approx_pad_hours };
}

export function leadCallableNow(lead: Pick<Lead, "timezone" | "tz_approx" | "org_id">, at = new Date()): boolean {
  return isCallableNow(at, lead.timezone, lead.tz_approx === 1, callWindow(lead.org_id));
}
