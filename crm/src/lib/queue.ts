import "server-only";
import { all, get, run, now } from "./db";
import { callWindow, getLead, type Lead } from "./leads";
import { getSettings } from "./settings";
import { isCallableNow } from "./time";
import type { User } from "./auth";

export type QueueGroup = "callback" | "new" | "retry";

type Candidate = {
  id: number;
  timezone: string | null;
  tz_approx: number;
  grp: QueueGroup;
};

/** Bring "not interested" leads back once their re-contact date arrives. */
export function reviveRecontacts(orgId: number) {
  run(
    `UPDATE leads SET status = 'new', attempts = 0, next_action_at = NULL, dead_reason = NULL,
       recontact_at = NULL, updated_at = ?
     WHERE org_id = ? AND status = 'dead' AND recontact_at IS NOT NULL AND recontact_at <= ?`,
    now(), orgId, now(),
  );
}

/**
 * Every lead this caller could work right now, in priority order:
 * callbacks due, then brand-new leads, then retries that have come due.
 * Leads outside their legal calling hours (or with an unknown zone) are left out.
 */
export function workableLeadIds(user: User, at = new Date()): { id: number; grp: QueueGroup }[] {
  reviveRecontacts(user.org_id);
  const iso = at.toISOString();
  const settings = getSettings(user.org_id);
  const lockCutoff = new Date(at.getTime() - settings.lock_minutes * 60_000).toISOString();
  const national = settings.block_national_dnc === 1;

  // A lead needs at least one number that isn't bad and isn't blocked.
  const hasCallable = `EXISTS (
    SELECT 1 FROM lead_phones p WHERE p.lead_id = l.id AND p.bad = 0
      AND NOT EXISTS (SELECT 1 FROM dnc d WHERE d.org_id = l.org_id AND d.phone = p.phone ${national ? "" : "AND d.scope = 'internal'"})
  )`;

  const rows = all<Candidate & { sortkey: string | null }>(
    `SELECT l.id, l.timezone, l.tz_approx,
       CASE
         WHEN EXISTS (SELECT 1 FROM tasks t WHERE t.lead_id = l.id AND t.user_id = ? AND t.type = 'callback' AND t.done_at IS NULL AND t.due_at <= ?) THEN 'callback'
         WHEN l.status = 'new' THEN 'new'
         ELSE 'retry'
       END AS grp,
       CASE
         WHEN EXISTS (SELECT 1 FROM tasks t WHERE t.lead_id = l.id AND t.user_id = ? AND t.type = 'callback' AND t.done_at IS NULL AND t.due_at <= ?)
           THEN (SELECT MIN(t.due_at) FROM tasks t WHERE t.lead_id = l.id AND t.user_id = ? AND t.type = 'callback' AND t.done_at IS NULL AND t.due_at <= ?)
         WHEN l.status = 'new' THEN printf('%012d', l.id)
         ELSE COALESCE(l.next_action_at, l.updated_at)
       END AS sortkey
     FROM leads l
     WHERE l.org_id = ? AND l.assigned_to = ?
       AND l.status NOT IN ('dead','dnc','client')
       AND (l.skip_until IS NULL OR l.skip_until <= ?)
       AND (l.locked_by IS NULL OR l.locked_by = ? OR l.locked_at < ?)
       AND ${hasCallable}
       AND (
         EXISTS (SELECT 1 FROM tasks t WHERE t.lead_id = l.id AND t.user_id = ? AND t.type = 'callback' AND t.done_at IS NULL AND t.due_at <= ?)
         OR (l.status = 'new' AND (l.next_action_at IS NULL OR l.next_action_at <= ?))
         OR (l.status = 'in_progress' AND (l.next_action_at IS NULL OR l.next_action_at <= ?))
       )`,
    user.id, iso, user.id, iso, user.id, iso,
    user.org_id, user.id, iso, user.id, lockCutoff,
    user.id, iso, iso, iso,
  );

  const order: Record<QueueGroup, number> = { callback: 0, new: 1, retry: 2 };
  const w = callWindow(user.org_id);
  return rows
    .filter((r) => isCallableNow(at, r.timezone, r.tz_approx === 1, w))
    .sort((a, b) => order[a.grp] - order[b.grp] || String(a.sortkey).localeCompare(String(b.sortkey)))
    .map((r) => ({ id: r.id, grp: r.grp }));
}

export type QueueState = {
  lead: Lead | null;
  group: QueueGroup | null;
  counts: Record<QueueGroup, number>;
  /** Leads assigned to the caller that are waiting on calling hours / zone fixes. */
  waiting: number;
};

/** Pick the next lead for a caller and reserve it for them. */
export function nextForCaller(user: User, at = new Date()): QueueState {
  const list = workableLeadIds(user, at);
  const counts: Record<QueueGroup, number> = { callback: 0, new: 0, retry: 0 };
  for (const r of list) counts[r.grp]++;

  const open = get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM leads WHERE org_id = ? AND assigned_to = ? AND status IN ('new','in_progress')",
    user.org_id, user.id,
  )?.n ?? 0;
  const waiting = Math.max(0, open - list.length);

  // Prefer the lead this caller already has open (so a page refresh doesn't skip it).
  const held = get<{ id: number }>(
    "SELECT id FROM leads WHERE org_id = ? AND locked_by = ? AND status IN ('new','in_progress','interested','meeting_booked') ORDER BY locked_at DESC LIMIT 1",
    user.org_id, user.id,
  );
  const heldEntry = held && list.find((r) => r.id === held.id);
  const pick = heldEntry ?? list[0];
  if (!pick) return { lead: null, group: null, counts, waiting };

  run("UPDATE leads SET locked_by = ?, locked_at = ? WHERE id = ? AND org_id = ?", user.id, at.toISOString(), pick.id, user.org_id);
  return { lead: getLead(user.org_id, pick.id) ?? null, group: pick.grp, counts, waiting };
}

export function releaseLead(orgId: number, leadId: number) {
  run("UPDATE leads SET locked_by = NULL, locked_at = NULL WHERE org_id = ? AND id = ?", orgId, leadId);
}

/** Park the current lead for a while and move on. */
export function skipLead(orgId: number, leadId: number, minutes = 30) {
  run(
    "UPDATE leads SET skip_until = ?, locked_by = NULL, locked_at = NULL WHERE org_id = ? AND id = ?",
    new Date(Date.now() + minutes * 60_000).toISOString(), orgId, leadId,
  );
}
