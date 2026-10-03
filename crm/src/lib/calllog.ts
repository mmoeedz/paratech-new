import "server-only";
import { all, get } from "./db";
import type { User } from "./auth";
import { zonedToUtc, addDays } from "./time";

export type CallFilters = { userId?: number; from?: string; to?: string; outcome?: string; listId?: number; q?: string };

export type CallLogRow = {
  id: number; called_at: string; user_id: number; user_name: string; lead_id: number; business_name: string;
  phone: string | null; outcome_key: string; outcome_label: string; notes: string | null; duration_sec: number | null;
  attempt_no: number; list_name: string | null; verified: string; recording_url: string | null;
};

/** `from`/`to` are YYYY-MM-DD in the viewer's zone; `to` is inclusive. */
export function dateRange(from: string | undefined, to: string | undefined, tz: string): { from?: string; to?: string } {
  const ok = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  return {
    from: ok(from) ? zonedToUtc(from!, "00:00", tz).toISOString() : undefined,
    to: ok(to) ? addDays(zonedToUtc(to!, "00:00", tz), 1).toISOString() : undefined,
  };
}

function where(user: User, f: CallFilters, tz: string) {
  const w = ["c.org_id = ?"];
  const p: (string | number)[] = [user.org_id];
  if (user.role === "caller") { w.push("c.user_id = ?"); p.push(user.id); }
  else if (f.userId) { w.push("c.user_id = ?"); p.push(f.userId); }
  const r = dateRange(f.from, f.to, tz);
  if (r.from) { w.push("c.called_at >= ?"); p.push(r.from); }
  if (r.to) { w.push("c.called_at < ?"); p.push(r.to); }
  if (f.outcome) { w.push("c.outcome_key = ?"); p.push(f.outcome); }
  if (f.listId) { w.push("c.list_id = ?"); p.push(f.listId); }
  if (f.q?.trim()) { w.push("(lower(l.business_name) LIKE ? OR lower(c.notes) LIKE ?)"); const like = `%${f.q.trim().toLowerCase()}%`; p.push(like, like); }
  return { w: w.join(" AND "), p };
}

const FROM = `FROM calls c JOIN users u ON u.id = c.user_id JOIN leads l ON l.id = c.lead_id LEFT JOIN call_lists cl ON cl.id = c.list_id`;

export function queryCalls(user: User, f: CallFilters, page: number, pageSize: number) {
  const { w, p } = where(user, f, user.timezone);
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n ${FROM} WHERE ${w}`, ...p)?.n ?? 0;
  const rows = all<CallLogRow>(
    `SELECT c.id, c.called_at, c.user_id, u.name AS user_name, c.lead_id, l.business_name, c.phone, c.outcome_key, c.outcome_label,
       c.notes, c.duration_sec, c.attempt_no, cl.name AS list_name, c.verified, c.recording_url
     ${FROM} WHERE ${w} ORDER BY c.called_at DESC, c.id DESC LIMIT ? OFFSET ?`,
    ...p, pageSize, (page - 1) * pageSize,
  );
  return { rows, total };
}

export function allCalls(user: User, f: CallFilters) {
  const { w, p } = where(user, f, user.timezone);
  return all<CallLogRow>(
    `SELECT c.id, c.called_at, c.user_id, u.name AS user_name, c.lead_id, l.business_name, c.phone, c.outcome_key, c.outcome_label,
       c.notes, c.duration_sec, c.attempt_no, cl.name AS list_name, c.verified, c.recording_url
     ${FROM} WHERE ${w} ORDER BY c.called_at DESC LIMIT 100000`,
    ...p,
  );
}
