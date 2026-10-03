import "server-only";
import { all, get, insert, run, now } from "./db";
import { addActivity } from "./leads";
import { dayBounds } from "./time";

export type Task = {
  id: number;
  org_id: number;
  lead_id: number | null;
  user_id: number;
  type: "callback" | "task";
  title: string;
  notes: string | null;
  due_at: string;
  lead_tz: string | null;
  done_at: string | null;
  created_by: number | null;
  created_at: string;
};

export type TaskRow = Task & { business_name: string | null; assignee_name: string; lead_status: string | null };

const SELECT = `
  SELECT t.*, l.business_name, l.status AS lead_status, u.name AS assignee_name
  FROM tasks t LEFT JOIN leads l ON l.id = t.lead_id JOIN users u ON u.id = t.user_id`;

export const getTask = (orgId: number, id: number) =>
  get<TaskRow>(`${SELECT} WHERE t.org_id = ? AND t.id = ?`, orgId, id);

export type TaskBuckets = { overdue: TaskRow[]; today: TaskRow[]; upcoming: TaskRow[] };

/** Open tasks for a user, bucketed by the caller's own calendar day. */
export function openTasksFor(orgId: number, userId: number, tz: string, opts: { all?: boolean } = {}): TaskBuckets {
  const rows = all<TaskRow>(
    `${SELECT} WHERE t.org_id = ? ${opts.all ? "" : "AND t.user_id = ?"} AND t.done_at IS NULL ORDER BY t.due_at`,
    ...(opts.all ? [orgId] : [orgId, userId]),
  );
  const { start, end } = dayBounds(new Date(), tz);
  const s = start.toISOString();
  const e = end.toISOString();
  const nowIso = now();
  return {
    // "Overdue" = past due and not part of today's remaining list.
    overdue: rows.filter((r) => r.due_at < nowIso && r.due_at < s),
    today: rows.filter((r) => r.due_at >= s && r.due_at < e),
    upcoming: rows.filter((r) => r.due_at >= e),
  };
}

export function createTask(input: {
  orgId: number; userId: number; createdBy: number; leadId?: number | null; type: "callback" | "task"; title: string; dueAt: Date; leadTz?: string | null; notes?: string | null;
}): number {
  const id = insert(
    `INSERT INTO tasks (org_id, lead_id, user_id, type, title, notes, due_at, lead_tz, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.orgId, input.leadId ?? null, input.userId, input.type, input.title.trim(), input.notes?.trim() || null,
    input.dueAt.toISOString(), input.leadTz ?? null, input.createdBy, now(),
  );
  if (input.leadId) {
    addActivity({
      orgId: input.orgId, leadId: input.leadId, userId: input.createdBy,
      type: input.type, summary: `${input.type === "callback" ? "Callback" : "Task"} scheduled: ${input.title.trim()}`,
    });
  }
  return id;
}

export function completeTask(orgId: number, taskId: number, userId: number) {
  const t = get<Task>("SELECT * FROM tasks WHERE org_id = ? AND id = ?", orgId, taskId);
  if (!t || t.done_at) return;
  run("UPDATE tasks SET done_at = ? WHERE id = ?", now(), taskId);
  if (t.lead_id) {
    addActivity({ orgId, leadId: t.lead_id, userId, type: t.type, summary: `${t.type === "callback" ? "Callback" : "Task"} completed: ${t.title}` });
  }
}

/** Tasks that just came due and haven't been announced to the user yet. */
export function dueReminders(orgId: number, userId: number): TaskRow[] {
  const rows = all<TaskRow>(
    `${SELECT} WHERE t.org_id = ? AND t.user_id = ? AND t.done_at IS NULL AND t.due_at <= ? AND t.reminded_at IS NULL ORDER BY t.due_at LIMIT 10`,
    orgId, userId, now(),
  );
  if (rows.length) {
    run(`UPDATE tasks SET reminded_at = ? WHERE id IN (${rows.map(() => "?").join(",")})`, now(), ...rows.map((r) => r.id));
  }
  return rows;
}

export function countDueNow(orgId: number, userId: number): number {
  return get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM tasks WHERE org_id = ? AND user_id = ? AND done_at IS NULL AND due_at <= ?",
    orgId, userId, now(),
  )?.n ?? 0;
}
