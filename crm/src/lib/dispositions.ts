import "server-only";
import { all, get, insert, run, tx } from "./db";
import {
  addActivity, addDnc, closeOpenTasks, getLead, getPhones, refreshLeadCallability, callWindow,
} from "./leads";
import { listOutcomes, getSettings } from "./settings";
import { createDeal, openDealForLead } from "./deals";
import { createMeeting } from "./meetings";
import { createTask } from "./tasks";
import { addDays, datetimeLocalToUtc, fmtDateTime, isCallableNow, zonedToUtc } from "./time";
import type { User } from "./auth";

export type CallInput = {
  leadId: number;
  outcomeKey: string;
  phone?: string | null;
  notes?: string | null;
  durationSec?: number | null;
  // Outcome-specific follow-up fields
  decisionMaker?: string | null;
  bestTime?: string | null; // "HH:MM" in the lead's time zone
  deadReason?: string | null;
  recontact?: boolean;
  callbackAt?: string | null; // datetime-local, lead's local time
  dealService?: string | null;
  dealValue?: number | null;
  meetingAt?: string | null; // datetime-local, lead's local time
  zoomLink?: string | null;
  attendees?: string | null;
};

export type CallResult = { ok: true; callId: number; summary: string } | { ok: false; error: string };

/**
 * Record a call and run the automatic next step for its outcome.
 * Everything happens in one transaction: either the whole disposition lands or nothing does.
 */
export function logCall(user: User, input: CallInput): CallResult {
  const lead = getLead(user.org_id, input.leadId);
  if (!lead) return { ok: false, error: "Lead not found." };
  if (user.role === "caller" && lead.assigned_to !== user.id) return { ok: false, error: "This lead isn't assigned to you." };
  if (lead.status === "dnc") return { ok: false, error: "This lead is on the do-not-call list." };

  const outcome = listOutcomes(user.org_id).find((o) => o.key === input.outcomeKey);
  if (!outcome) return { ok: false, error: "Unknown outcome." };

  const settings = getSettings(user.org_id);
  const tz = lead.timezone ?? "America/New_York";
  const at = new Date();
  const phones = getPhones(lead.id);
  const dialled = phones.find((p) => p.phone === input.phone) ?? phones.find((p) => !p.bad) ?? phones[0];

  // ---- validate outcome-specific input before touching anything
  let callbackAt: Date | null = null;
  let meetingAt: Date | null = null;
  const nextRetryAt = (days: number, bestTime?: string | null): Date => {
    if (bestTime && /^\d{2}:\d{2}$/.test(bestTime)) {
      const local = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(addDays(at, days)); // YYYY-MM-DD
      return zonedToUtc(local, bestTime, tz);
    }
    return addDays(at, days);
  };

  switch (outcome.action) {
    case "dead":
      if (!input.deadReason?.trim()) return { ok: false, error: "Pick a reason for 'not interested'." };
      break;
    case "callback": {
      callbackAt = input.callbackAt ? datetimeLocalToUtc(input.callbackAt, tz) : null;
      if (!callbackAt) return { ok: false, error: "Pick the callback date and time." };
      if (callbackAt.getTime() < at.getTime() - 60_000) return { ok: false, error: "The callback time is in the past." };
      if (!isCallableNow(callbackAt, tz, lead.tz_approx === 1, callWindow(user.org_id))) {
        return { ok: false, error: `That time is outside legal calling hours for this lead (${settings.calling_start_hour}:00–${settings.calling_end_hour}:00 ${tz}).` };
      }
      break;
    }
    case "meeting": {
      meetingAt = input.meetingAt ? datetimeLocalToUtc(input.meetingAt, tz) : null;
      if (!meetingAt) return { ok: false, error: "Pick the meeting date and time." };
      if (meetingAt.getTime() < at.getTime() - 60_000) return { ok: false, error: "The meeting time is in the past." };
      break;
    }
    case "gatekeeper":
      if (input.bestTime && !/^\d{2}:\d{2}$/.test(input.bestTime)) return { ok: false, error: "Best time must be a valid time." };
      break;
    default:
  }

  const attemptNo = lead.attempts + 1;
  const maxed = attemptNo >= settings.max_attempts;
  const ts = at.toISOString();

  return tx(() => {
    const callId = insert(
      `INSERT INTO calls (org_id, lead_id, user_id, phone, outcome_key, outcome_label, action, conversation, notes,
         duration_sec, attempt_no, list_id, called_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      user.org_id, lead.id, user.id, dialled?.phone ?? null, outcome.key, outcome.label, outcome.action,
      outcome.is_conversation, input.notes?.trim() || null, input.durationSec ?? null, attemptNo, lead.list_id, ts,
    );
    run(
      "UPDATE leads SET attempts = ?, last_called_at = ?, skip_until = NULL, updated_at = ? WHERE id = ?",
      attemptNo, ts, ts, lead.id,
    );
    let summary = outcome.label;

    const retryOrDie = (days: number, bestTime?: string | null) => {
      if (maxed) {
        run("UPDATE leads SET status = 'dead', dead_reason = ?, next_action_at = NULL WHERE id = ?", `Max attempts reached (${settings.max_attempts})`, lead.id);
        closeOpenTasks(user.org_id, lead.id);
        summary += ` — attempt cap reached, lead closed`;
      } else {
        const when = nextRetryAt(days, bestTime);
        run("UPDATE leads SET status = 'in_progress', next_action_at = ? WHERE id = ?", when.toISOString(), lead.id);
        summary += ` — retry ${fmtDateTime(when, user.timezone)}`;
      }
    };

    switch (outcome.action) {
      case "retry":
        retryOrDie(outcome.retry_days ?? 1);
        break;

      case "gatekeeper": {
        run(
          "UPDATE leads SET decision_maker = COALESCE(?, decision_maker), best_time = COALESCE(?, best_time) WHERE id = ?",
          input.decisionMaker?.trim() || null, input.bestTime || null, lead.id,
        );
        if (input.decisionMaker?.trim() && !lead.contact_name) {
          run("UPDATE leads SET contact_name = ? WHERE id = ?", input.decisionMaker.trim(), lead.id);
        }
        retryOrDie(outcome.retry_days ?? 1, input.bestTime);
        break;
      }

      case "bad_number": {
        if (dialled) {
          run("UPDATE lead_phones SET bad = 1, bad_reason = 'wrong number / disconnected' WHERE id = ?", dialled.id);
        }
        const left = get<{ n: number }>("SELECT COUNT(*) AS n FROM lead_phones WHERE lead_id = ? AND bad = 0", lead.id)?.n ?? 0;
        if (left > 0) {
          run("UPDATE leads SET status = 'in_progress', next_action_at = ? WHERE id = ?", ts, lead.id);
          summary += " — number marked bad, other number still available";
        } else {
          refreshLeadCallability(user.org_id, lead.id);
          summary += " — no working number left, lead closed";
        }
        break;
      }

      case "dead": {
        const recontactAt = input.recontact ? addDays(at, settings.recontact_days).toISOString() : null;
        run(
          "UPDATE leads SET status = 'dead', dead_reason = ?, recontact_at = ?, next_action_at = NULL WHERE id = ?",
          input.deadReason!.trim(), recontactAt, lead.id,
        );
        closeOpenTasks(user.org_id, lead.id);
        summary += ` — ${input.deadReason!.trim()}${recontactAt ? `, re-contact in ${settings.recontact_days} days` : ""}`;
        break;
      }

      case "callback": {
        run("UPDATE leads SET status = CASE WHEN status = 'new' THEN 'in_progress' ELSE status END, next_action_at = ? WHERE id = ?", callbackAt!.toISOString(), lead.id);
        // Pending callbacks for this lead are superseded by the new one.
        closeOpenTasks(user.org_id, lead.id);
        createTask({
          orgId: user.org_id, userId: user.id, createdBy: user.id, leadId: lead.id, type: "callback",
          title: `Call back ${lead.business_name}`, dueAt: callbackAt!, leadTz: tz, notes: input.notes,
        });
        summary += ` — ${fmtDateTime(callbackAt!, user.timezone)} your time`;
        break;
      }

      case "deal": {
        if (!openDealForLead(user.org_id, lead.id)) {
          createDeal({ orgId: user.org_id, leadId: lead.id, userId: user.id, service: input.dealService, value: input.dealValue ?? 0 });
        }
        run("UPDATE leads SET status = 'interested', next_action_at = NULL WHERE id = ?", lead.id);
        closeOpenTasks(user.org_id, lead.id);
        summary += " — moved to the Deals pipeline";
        break;
      }

      case "meeting": {
        if (!openDealForLead(user.org_id, lead.id)) {
          createDeal({ orgId: user.org_id, leadId: lead.id, userId: user.id, service: input.dealService, value: input.dealValue ?? 0 });
        }
        createMeeting({
          orgId: user.org_id, leadId: lead.id, userId: user.id, at: meetingAt!,
          zoomLink: input.zoomLink, attendees: input.attendees,
        });
        run("UPDATE leads SET next_action_at = NULL WHERE id = ?", lead.id);
        closeOpenTasks(user.org_id, lead.id);
        summary += ` — ${fmtDateTime(meetingAt!, user.timezone)} your time`;
        break;
      }

      case "dnc": {
        for (const p of phones) {
          addDnc(user.org_id, p.phone, { scope: "internal", reason: "Asked not to be called", leadId: lead.id, userId: user.id });
        }
        run("UPDATE leads SET status = 'dnc', dead_reason = 'Do not call', next_action_at = NULL WHERE id = ?", lead.id);
        closeOpenTasks(user.org_id, lead.id);
        summary += " — all numbers blocked";
        break;
      }
    }

    run("UPDATE leads SET locked_by = NULL, locked_at = NULL WHERE id = ?", lead.id);
    addActivity({
      orgId: user.org_id, leadId: lead.id, userId: user.id, type: "call",
      summary: `Call #${attemptNo}: ${summary}`, body: input.notes?.trim() || null,
    });
    return { ok: true as const, callId, summary };
  });
}

export function recentCalls(orgId: number, leadId: number, limit = 5) {
  return all<{ id: number; outcome_label: string; notes: string | null; called_at: string; user_name: string; attempt_no: number }>(
    `SELECT c.id, c.outcome_label, c.notes, c.called_at, c.attempt_no, u.name AS user_name
     FROM calls c JOIN users u ON u.id = c.user_id WHERE c.org_id = ? AND c.lead_id = ? ORDER BY c.called_at DESC LIMIT ?`,
    orgId, leadId, limit,
  );
}
