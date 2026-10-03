import "server-only";
import Papa from "papaparse";
import { all, get, run, tx, now, insert } from "./db";
import { parsePhone } from "./phone";
import { addActivity } from "./leads";

/** Zoom exports name their columns differently by report; match on loose patterns. */
const COLS = {
  email: /(caller|user|agent|extension).*(email)|^(user )?email$/i,
  to: /(callee|called|dialed|destination|^to\b|\bto (number|phone))/i,
  from: /(caller).*(number)|^from( number)?$/i,
  start: /(start|call).*(time|date)|^time$/i,
  duration: /duration/i,
  direction: /direction|call type/i,
  recording: /recording|record.*(url|link)/i,
};

function findCol(headers: string[], re: RegExp, exclude: number[] = []) {
  return headers.findIndex((h, i) => !exclude.includes(i) && re.test(h.trim()));
}

function parseDuration(v: string): number | null {
  if (!v) return null;
  if (/^\d+$/.test(v)) return Number(v);
  const m = v.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return m[3] ? +m[1] * 3600 + +m[2] * 60 + +m[3] : +m[1] * 60 + +m[2];
}

export type ZoomImportResult = {
  rows: number;
  imported: number;
  skipped: number;
  matchedCalls: number;
  error?: string;
};

export function importZoomLog(orgId: number, text: string, batchLabel: string): ZoomImportResult {
  const parsed = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
  const table = parsed.data;
  if (table.length < 2) return { rows: 0, imported: 0, skipped: 0, matchedCalls: 0, error: "The file has no call rows." };
  const headers = table[0].map((h) => String(h));

  const email = findCol(headers, COLS.email);
  const start = findCol(headers, COLS.start);
  const to = findCol(headers, COLS.to, [email, start]);
  const duration = findCol(headers, COLS.duration);
  const direction = findCol(headers, COLS.direction);
  const recording = findCol(headers, COLS.recording);
  if (start < 0 || to < 0) {
    return { rows: 0, imported: 0, skipped: 0, matchedCalls: 0, error: "Couldn't find the call start time and callee number columns in this file." };
  }

  const users = all<{ id: number; email: string; zoom_email: string | null }>("SELECT id, email, zoom_email FROM users WHERE org_id = ?", orgId);
  const userByEmail = new Map<string, number>();
  for (const u of users) {
    userByEmail.set(u.email.toLowerCase(), u.id);
    if (u.zoom_email) userByEmail.set(u.zoom_email.toLowerCase(), u.id);
  }

  let imported = 0;
  let skipped = 0;
  tx(() => {
    for (const r of table.slice(1)) {
      const dir = direction >= 0 ? r[direction]?.toLowerCase() ?? "" : "outbound";
      const phone = parsePhone(r[to]);
      const when = new Date(r[start]);
      if (dir.includes("inbound") || !phone.ok || isNaN(when.getTime())) {
        skipped++;
        continue;
      }
      const callerEmail = email >= 0 ? (r[email] ?? "").trim().toLowerCase() : "";
      const dup = get<{ id: number }>(
        "SELECT id FROM zoom_calls WHERE org_id = ? AND phone = ? AND started_at = ? AND COALESCE(caller_email,'') = ?",
        orgId, phone.e164, when.toISOString(), callerEmail,
      );
      if (dup) {
        skipped++;
        continue;
      }
      insert(
        `INSERT INTO zoom_calls (org_id, batch, caller_email, user_id, phone, started_at, duration_sec, direction, recording_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        orgId, batchLabel, callerEmail || null, userByEmail.get(callerEmail) ?? null, phone.e164, when.toISOString(),
        duration >= 0 ? parseDuration(r[duration] ?? "") : null, dir || "outbound",
        recording >= 0 && /^https?:\/\//i.test(r[recording] ?? "") ? r[recording] : null, now(),
      );
      imported++;
    }
  });
  const matchedCalls = reconcile(orgId);
  return { rows: table.length - 1, imported, skipped, matchedCalls };
}

const BEFORE_MS = 5 * 60_000;
const AFTER_MS = 45 * 60_000;

/**
 * Match logged CRM calls to Zoom call records (same caller, same number, logged
 * within a window around the Zoom call). Calls inside the period Zoom data covers
 * that have no Zoom record are flagged "unmatched".
 */
export function reconcile(orgId: number): number {
  const zooms = all<{ id: number; user_id: number | null; phone: string; started_at: string; duration_sec: number | null; recording_url: string | null }>(
    "SELECT id, user_id, phone, started_at, duration_sec, recording_url FROM zoom_calls WHERE org_id = ? AND matched_call_id IS NULL ORDER BY started_at",
    orgId,
  );
  let matched = 0;
  tx(() => {
    for (const z of zooms) {
      const t = new Date(z.started_at).getTime();
      const lo = new Date(t - BEFORE_MS).toISOString();
      const hi = new Date(t + (z.duration_sec ?? 0) * 1000 + AFTER_MS).toISOString();
      const call = get<{ id: number; lead_id: number }>(
        `SELECT id, lead_id FROM calls WHERE org_id = ? AND phone = ? AND zoom_call_id IS NULL
           ${z.user_id ? "AND user_id = ?" : ""} AND called_at >= ? AND called_at <= ? ORDER BY called_at LIMIT 1`,
        ...(z.user_id ? [orgId, z.phone, z.user_id, lo, hi] : [orgId, z.phone, lo, hi]),
      );
      if (!call) continue;
      run("UPDATE calls SET zoom_call_id = ?, verified = 'matched', recording_url = COALESCE(?, recording_url), duration_sec = COALESCE(duration_sec, ?) WHERE id = ?",
        z.id, z.recording_url, z.duration_sec, call.id);
      run("UPDATE zoom_calls SET matched_call_id = ?, lead_id = ? WHERE id = ?", call.id, call.lead_id, z.id);
      if (z.recording_url) addActivity({ orgId, leadId: call.lead_id, type: "recording", summary: "Zoom recording attached to call", body: z.recording_url });
      matched++;
    }
    // Flag logged calls the Zoom data should have covered but didn't.
    const range = get<{ lo: string | null; hi: string | null }>("SELECT MIN(started_at) AS lo, MAX(started_at) AS hi FROM zoom_calls WHERE org_id = ?", orgId);
    if (range?.lo && range.hi) {
      run(
        `UPDATE calls SET verified = 'unmatched' WHERE org_id = ? AND zoom_call_id IS NULL AND called_at >= ? AND called_at <= ?
           AND user_id IN (SELECT DISTINCT user_id FROM zoom_calls WHERE org_id = ? AND user_id IS NOT NULL)`,
        orgId, range.lo, new Date(new Date(range.hi).getTime() + AFTER_MS).toISOString(), orgId,
      );
    }
  });
  return matched;
}

export type VerificationRow = {
  user_id: number; name: string; logged: number; matched: number; unmatched: number; unlogged_zoom: number;
};

export function verificationReport(orgId: number): VerificationRow[] {
  return all<VerificationRow>(
    `SELECT u.id AS user_id, u.name,
       (SELECT COUNT(*) FROM calls c WHERE c.user_id = u.id AND c.verified != 'unchecked') AS logged,
       (SELECT COUNT(*) FROM calls c WHERE c.user_id = u.id AND c.verified = 'matched') AS matched,
       (SELECT COUNT(*) FROM calls c WHERE c.user_id = u.id AND c.verified = 'unmatched') AS unmatched,
       (SELECT COUNT(*) FROM zoom_calls z WHERE z.user_id = u.id AND z.matched_call_id IS NULL) AS unlogged_zoom
     FROM users u WHERE u.org_id = ? AND u.role = 'caller' AND u.active = 1
       AND (EXISTS (SELECT 1 FROM zoom_calls z WHERE z.user_id = u.id) OR EXISTS (SELECT 1 FROM calls c WHERE c.user_id = u.id AND c.verified != 'unchecked'))
     ORDER BY u.name`,
    orgId,
  );
}

export const zoomBatches = (orgId: number) =>
  all<{ batch: string | null; n: number; first: string; last: string }>(
    "SELECT batch, COUNT(*) AS n, MIN(started_at) AS first, MAX(started_at) AS last FROM zoom_calls WHERE org_id = ? GROUP BY batch ORDER BY MAX(created_at) DESC LIMIT 10",
    orgId,
  );

export const unmatchedCalls = (orgId: number, limit = 100) =>
  all<{ id: number; called_at: string; phone: string | null; outcome_label: string; user_name: string; business_name: string; lead_id: number }>(
    `SELECT c.id, c.called_at, c.phone, c.outcome_label, u.name AS user_name, l.business_name, c.lead_id
     FROM calls c JOIN users u ON u.id = c.user_id JOIN leads l ON l.id = c.lead_id
     WHERE c.org_id = ? AND c.verified = 'unmatched' ORDER BY c.called_at DESC LIMIT ?`,
    orgId, limit,
  );

export const unloggedZoomCalls = (orgId: number, limit = 100) =>
  all<{ id: number; started_at: string; phone: string; duration_sec: number | null; user_name: string | null; caller_email: string | null }>(
    `SELECT z.id, z.started_at, z.phone, z.duration_sec, u.name AS user_name, z.caller_email
     FROM zoom_calls z LEFT JOIN users u ON u.id = z.user_id
     WHERE z.org_id = ? AND z.matched_call_id IS NULL ORDER BY z.started_at DESC LIMIT ?`,
    orgId, limit,
  );
