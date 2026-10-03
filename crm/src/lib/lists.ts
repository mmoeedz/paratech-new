import "server-only";
import { all, get, insert, run, tx, now } from "./db";
import { addActivity, audit } from "./leads";
import { validUserId } from "./auth";

export type CallList = {
  id: number;
  org_id: number;
  name: string;
  niche: string | null;
  state: string | null;
  created_by: number | null;
  created_at: string;
  archived: number;
};

export type ListProgress = CallList & {
  total: number;
  called: number;
  remaining: number;
  interested: number;
  dead: number;
  unassigned: number;
};

export const getList = (orgId: number, id: number) =>
  get<CallList>("SELECT * FROM call_lists WHERE org_id = ? AND id = ?", orgId, id);

export function createList(orgId: number, userId: number, input: { name: string; niche?: string | null; state?: string | null }): number {
  return insert(
    "INSERT INTO call_lists (org_id, name, niche, state, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    orgId, input.name.trim(), input.niche || null, input.state || null, userId, now(),
  );
}

/** Per-list progress: total, called, remaining, interested, dead. */
export function listProgress(orgId: number, opts: { includeArchived?: boolean } = {}): ListProgress[] {
  return all<ListProgress>(
    `SELECT cl.*,
       COUNT(l.id) AS total,
       COALESCE(SUM(CASE WHEN l.attempts > 0 THEN 1 ELSE 0 END), 0) AS called,
       COALESCE(SUM(CASE WHEN l.status IN ('new','in_progress') THEN 1 ELSE 0 END), 0) AS remaining,
       COALESCE(SUM(CASE WHEN l.status IN ('interested','meeting_booked','client') THEN 1 ELSE 0 END), 0) AS interested,
       COALESCE(SUM(CASE WHEN l.status IN ('dead','dnc') THEN 1 ELSE 0 END), 0) AS dead,
       COALESCE(SUM(CASE WHEN l.assigned_to IS NULL AND l.status IN ('new','in_progress') THEN 1 ELSE 0 END), 0) AS unassigned
     FROM call_lists cl LEFT JOIN leads l ON l.list_id = cl.id
     WHERE cl.org_id = ? ${opts.includeArchived ? "" : "AND cl.archived = 0"}
     GROUP BY cl.id ORDER BY cl.created_at DESC`,
    orgId,
  );
}

export function listAssignees(orgId: number, listId: number) {
  return all<{ user_id: number; name: string; open: number; total: number }>(
    `SELECT u.id AS user_id, u.name,
       SUM(CASE WHEN l.status IN ('new','in_progress') THEN 1 ELSE 0 END) AS open, COUNT(*) AS total
     FROM leads l JOIN users u ON u.id = l.assigned_to
     WHERE l.org_id = ? AND l.list_id = ? GROUP BY u.id ORDER BY u.name`,
    orgId, listId,
  );
}

/** Another caller currently has the lead open (within the lock window). */
function lockedByOther(lockMinutes: number) {
  const cutoff = new Date(Date.now() - lockMinutes * 60_000).toISOString();
  return { cutoff };
}

export type AssignMode = "unassigned" | "all_open";

/**
 * Assign leads from a list to callers.
 *  - `unassigned`: only leads nobody owns yet
 *  - `all_open`:   also take open leads away from their current caller (reassign)
 * `count` limits how many leads move (null = all); `callerIds` are filled round-robin
 * so a list splits evenly. Leads another caller has open right now are left alone —
 * a lead belongs to one caller at a time, so two people never call the same business.
 */
export function assignList(
  orgId: number, userId: number,
  opts: { listId: number; callerIds: number[]; mode: AssignMode; count: number | null; lockMinutes: number },
): { moved: number; skippedLocked: number } {
  const callerIds = opts.callerIds.map((id) => validUserId(orgId, id)).filter((id): id is number => id !== null);
  if (callerIds.length === 0) return { moved: 0, skippedLocked: 0 };
  const { cutoff } = lockedByOther(opts.lockMinutes);
  const rows = all<{ id: number; assigned_to: number | null; locked_by: number | null; locked_at: string | null }>(
    `SELECT id, assigned_to, locked_by, locked_at FROM leads
     WHERE org_id = ? AND list_id = ? AND status IN ('new','in_progress')
       ${opts.mode === "unassigned" ? "AND assigned_to IS NULL" : ""}
     ORDER BY id`,
    orgId, opts.listId,
  );
  let moved = 0;
  let skippedLocked = 0;
  tx(() => {
    let i = 0;
    for (const r of rows) {
      if (opts.count !== null && moved >= opts.count) break;
      if (r.locked_by && r.locked_by !== userId && r.locked_at && r.locked_at >= cutoff) {
        skippedLocked++;
        continue;
      }
      const target = callerIds[i % callerIds.length];
      i++;
      if (r.assigned_to === target) continue;
      run("UPDATE leads SET assigned_to = ?, locked_by = NULL, locked_at = NULL, updated_at = ? WHERE id = ?", target, now(), r.id);
      moved++;
    }
    audit(orgId, userId, "list.assign", `list ${opts.listId}: ${moved} leads -> users ${callerIds.join(",")}`);
  });
  return { moved, skippedLocked };
}

/** Hand one lead to another caller (blocked while someone else has it open). */
export function reassignLead(orgId: number, userId: number, leadId: number, toUserId: number | null, lockMinutes: number):
  { ok: true } | { ok: false; error: string } {
  const lead = get<{ locked_by: number | null; locked_at: string | null; assigned_to: number | null }>(
    "SELECT locked_by, locked_at, assigned_to FROM leads WHERE org_id = ? AND id = ?", orgId, leadId,
  );
  if (!lead) return { ok: false, error: "Lead not found." };
  if (toUserId !== null && !validUserId(orgId, toUserId)) return { ok: false, error: "That caller wasn't found." };
  const cutoff = new Date(Date.now() - lockMinutes * 60_000).toISOString();
  if (lead.locked_by && lead.locked_by !== userId && lead.locked_at && lead.locked_at >= cutoff) {
    return { ok: false, error: "Another caller has this lead open right now. Try again in a few minutes." };
  }
  run("UPDATE leads SET assigned_to = ?, locked_by = NULL, locked_at = NULL, updated_at = ? WHERE id = ?", toUserId, now(), leadId);
  const to = toUserId ? get<{ name: string }>("SELECT name FROM users WHERE id = ?", toUserId)?.name : "nobody";
  addActivity({ orgId, leadId, userId, type: "assign", summary: `Assigned to ${to}` });
  return { ok: true };
}
