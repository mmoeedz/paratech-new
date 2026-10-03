import "server-only";
import { all, get } from "./db";

export type ReportFilters = {
  from: string; // ISO UTC, inclusive
  to: string; // ISO UTC, exclusive
  userId?: number;
  listId?: number;
  niche?: string;
};

/** Build the shared WHERE clause for calls joined to leads (alias c / l). */
function callWhere(orgId: number, f: ReportFilters) {
  const where = ["c.org_id = ?", "c.called_at >= ?", "c.called_at < ?"];
  const params: (string | number)[] = [orgId, f.from, f.to];
  if (f.userId) { where.push("c.user_id = ?"); params.push(f.userId); }
  if (f.listId) { where.push("l.list_id = ?"); params.push(f.listId); }
  if (f.niche) { where.push("l.niche = ?"); params.push(f.niche); }
  return { w: where.join(" AND "), params };
}

export type Funnel = { calls: number; conversations: number; interested: number; meetings: number; won: number };

function wonDeals(orgId: number, f: ReportFilters) {
  const where = ["d.org_id = ?", "s.kind = 'won'", "d.closed_at >= ?", "d.closed_at < ?"];
  const params: (string | number)[] = [orgId, f.from, f.to];
  if (f.userId) { where.push("d.found_by = ?"); params.push(f.userId); }
  if (f.listId) { where.push("l.list_id = ?"); params.push(f.listId); }
  if (f.niche) { where.push("l.niche = ?"); params.push(f.niche); }
  return get<{ n: number; v: number }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(d.value), 0) AS v FROM deals d
     JOIN pipeline_stages s ON s.id = d.stage_id JOIN leads l ON l.id = d.lead_id WHERE ${where.join(" AND ")}`,
    ...params,
  )!;
}

export function funnel(orgId: number, f: ReportFilters): Funnel & { revenue: number } {
  const { w, params } = callWhere(orgId, f);
  const r = get<{ calls: number; conversations: number; interested: number; meetings: number }>(
    `SELECT COUNT(*) AS calls,
       COALESCE(SUM(c.conversation), 0) AS conversations,
       COALESCE(SUM(CASE WHEN c.action IN ('deal','meeting') THEN 1 ELSE 0 END), 0) AS interested,
       COALESCE(SUM(CASE WHEN c.action = 'meeting' THEN 1 ELSE 0 END), 0) AS meetings
     FROM calls c JOIN leads l ON l.id = c.lead_id WHERE ${w}`,
    ...params,
  )!;
  const won = wonDeals(orgId, f);
  return { ...r, won: won.n, revenue: won.v };
}

export type CallerRow = {
  user_id: number; name: string; calls: number; conversations: number; interested: number; meetings: number;
  callbacks_done: number; won: number; revenue: number; talk_sec: number;
};

export function byCaller(orgId: number, f: ReportFilters): CallerRow[] {
  const { w, params } = callWhere(orgId, { ...f, userId: undefined });
  const callers = all<{ id: number; name: string }>(
    `SELECT id, name FROM users WHERE org_id = ? AND role != 'admin' AND active = 1 ${f.userId ? "AND id = ?" : ""} ORDER BY name`,
    ...(f.userId ? [orgId, f.userId] : [orgId]),
  );
  const calls = all<{ user_id: number; calls: number; conversations: number; interested: number; meetings: number; talk: number }>(
    `SELECT c.user_id, COUNT(*) AS calls, COALESCE(SUM(c.conversation),0) AS conversations,
       COALESCE(SUM(CASE WHEN c.action IN ('deal','meeting') THEN 1 ELSE 0 END),0) AS interested,
       COALESCE(SUM(CASE WHEN c.action = 'meeting' THEN 1 ELSE 0 END),0) AS meetings,
       COALESCE(SUM(c.duration_sec),0) AS talk
     FROM calls c JOIN leads l ON l.id = c.lead_id WHERE ${w} GROUP BY c.user_id`,
    ...params,
  );
  const cbs = all<{ user_id: number; n: number }>(
    "SELECT user_id, COUNT(*) AS n FROM tasks WHERE org_id = ? AND type = 'callback' AND done_at >= ? AND done_at < ? GROUP BY user_id",
    orgId, f.from, f.to,
  );
  const wins = all<{ user_id: number; n: number; v: number }>(
    `SELECT d.found_by AS user_id, COUNT(*) AS n, COALESCE(SUM(d.value),0) AS v FROM deals d
     JOIN pipeline_stages s ON s.id = d.stage_id JOIN leads l ON l.id = d.lead_id
     WHERE d.org_id = ? AND s.kind = 'won' AND d.closed_at >= ? AND d.closed_at < ?
       ${f.listId ? "AND l.list_id = ?" : ""} ${f.niche ? "AND l.niche = ?" : ""} GROUP BY d.found_by`,
    orgId, f.from, f.to, ...(f.listId ? [f.listId] : []), ...(f.niche ? [f.niche] : []),
  );
  return callers.map((u) => {
    const c = calls.find((x) => x.user_id === u.id);
    return {
      user_id: u.id, name: u.name,
      calls: c?.calls ?? 0, conversations: c?.conversations ?? 0, interested: c?.interested ?? 0, meetings: c?.meetings ?? 0,
      talk_sec: c?.talk ?? 0,
      callbacks_done: cbs.find((x) => x.user_id === u.id)?.n ?? 0,
      won: wins.find((x) => x.user_id === u.id)?.n ?? 0,
      revenue: wins.find((x) => x.user_id === u.id)?.v ?? 0,
    };
  });
}

export type SegmentRow = { label: string; leads: number; calls: number; conversations: number; interested: number; won: number };

/** Which niches / states convert best. Counts are leads that were called in the window. */
export function bySegment(orgId: number, f: ReportFilters, dim: "niche" | "state"): SegmentRow[] {
  const { w, params } = callWhere(orgId, f);
  const col = dim === "niche" ? "l.niche" : "l.state";
  return all<SegmentRow>(
    `SELECT COALESCE(${col}, 'Unknown') AS label,
       COUNT(DISTINCT c.lead_id) AS leads, COUNT(*) AS calls,
       COALESCE(SUM(c.conversation),0) AS conversations,
       COUNT(DISTINCT CASE WHEN c.action IN ('deal','meeting') THEN c.lead_id END) AS interested,
       COUNT(DISTINCT CASE WHEN l.status = 'client' THEN c.lead_id END) AS won
     FROM calls c JOIN leads l ON l.id = c.lead_id WHERE ${w} GROUP BY label ORDER BY interested DESC, calls DESC`,
    ...params,
  );
}

export function pipelineSummary(orgId: number, scopeUserId?: number) {
  return all<{ stage: string; kind: string; deals: number; value: number }>(
    `SELECT s.name AS stage, s.kind, COUNT(d.id) AS deals, COALESCE(SUM(d.value),0) AS value
     FROM pipeline_stages s LEFT JOIN deals d ON d.stage_id = s.id ${scopeUserId ? "AND (d.owner_id = ? OR d.found_by = ?)" : ""}
     WHERE s.org_id = ? GROUP BY s.id ORDER BY s.sort`,
    ...(scopeUserId ? [scopeUserId, scopeUserId, orgId] : [orgId]),
  );
}

export function dailyCalls(orgId: number, f: ReportFilters, tz: string) {
  const { w, params } = callWhere(orgId, f);
  const rows = all<{ called_at: string; conversation: number }>(
    `SELECT c.called_at, c.conversation FROM calls c JOIN leads l ON l.id = c.lead_id WHERE ${w}`, ...params,
  );
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz });
  const days = new Map<string, { calls: number; conversations: number }>();
  for (const r of rows) {
    const d = fmt.format(new Date(r.called_at));
    const cur = days.get(d) ?? { calls: 0, conversations: 0 };
    cur.calls++;
    cur.conversations += r.conversation;
    days.set(d, cur);
  }
  return [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v }));
}
