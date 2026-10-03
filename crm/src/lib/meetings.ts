import "server-only";
import { all, get, insert, run, tx, now } from "./db";
import { addActivity, getLead } from "./leads";
import { createDeal, moveDeal, openDealForLead, stageByNameOr } from "./deals";
import { fmtDateTime } from "./time";

export type Meeting = {
  id: number;
  org_id: number;
  lead_id: number;
  deal_id: number | null;
  scheduled_at: string;
  lead_tz: string | null;
  zoom_link: string | null;
  attendees: string | null;
  owner_id: number | null;
  created_by: number | null;
  outcome: "pending" | "held" | "no_show" | "rescheduled";
  notes: string | null;
  created_at: string;
};

export type MeetingRow = Meeting & { business_name: string; owner_name: string | null; contact_name: string | null };

const SELECT = `
  SELECT m.*, l.business_name, l.contact_name, u.name AS owner_name
  FROM meetings m JOIN leads l ON l.id = m.lead_id LEFT JOIN users u ON u.id = m.owner_id`;

export function listMeetings(orgId: number, opts: { from?: string; to?: string; outcome?: string; scopeUserId?: number } = {}): MeetingRow[] {
  const where = ["m.org_id = ?"];
  const params: (string | number)[] = [orgId];
  if (opts.from) { where.push("m.scheduled_at >= ?"); params.push(opts.from); }
  if (opts.to) { where.push("m.scheduled_at < ?"); params.push(opts.to); }
  if (opts.outcome) { where.push("m.outcome = ?"); params.push(opts.outcome); }
  if (opts.scopeUserId) {
    where.push("(m.owner_id = ? OR m.created_by = ?)");
    params.push(opts.scopeUserId, opts.scopeUserId);
  }
  return all<MeetingRow>(`${SELECT} WHERE ${where.join(" AND ")} ORDER BY m.scheduled_at`, ...params);
}

export const getMeeting = (orgId: number, id: number) =>
  get<MeetingRow>(`${SELECT} WHERE m.org_id = ? AND m.id = ?`, orgId, id);

export function leadMeetings(orgId: number, leadId: number): MeetingRow[] {
  return all<MeetingRow>(`${SELECT} WHERE m.org_id = ? AND m.lead_id = ? ORDER BY m.scheduled_at DESC`, orgId, leadId);
}

/** Book a meeting; makes sure the lead has an open deal sitting in the "Meeting booked" stage. */
export function createMeeting(input: {
  orgId: number; leadId: number; userId: number; at: Date; zoomLink?: string | null; attendees?: string | null; ownerId?: number | null;
}): number {
  const lead = getLead(input.orgId, input.leadId);
  if (!lead) throw new Error("Lead not found");
  return tx(() => {
    const deal = openDealForLead(input.orgId, input.leadId);
    const stage = stageByNameOr(input.orgId, "Meeting booked", 1);
    let dealId: number;
    if (deal) {
      dealId = deal.id;
    } else {
      dealId = createDeal({ orgId: input.orgId, leadId: input.leadId, userId: input.userId, stageId: stage?.id });
    }
    const id = insert(
      `INSERT INTO meetings (org_id, lead_id, deal_id, scheduled_at, lead_tz, zoom_link, attendees, owner_id, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.orgId, input.leadId, dealId, input.at.toISOString(), lead.timezone, input.zoomLink?.trim() || null,
      input.attendees?.trim() || null, input.ownerId ?? input.userId, input.userId, now(),
    );
    // Only move forward — an existing deal further along stays put.
    const current = get<{ sort: number }>("SELECT s.sort FROM deals d JOIN pipeline_stages s ON s.id = d.stage_id WHERE d.id = ?", dealId);
    if (stage && current && current.sort < stage.sort) moveDeal(input.orgId, dealId, stage.id, input.userId);
    run("UPDATE leads SET status = 'meeting_booked', updated_at = ? WHERE id = ? AND status NOT IN ('client')", now(), input.leadId);
    addActivity({
      orgId: input.orgId, leadId: input.leadId, dealId, userId: input.userId, type: "meeting",
      summary: `Meeting booked for ${fmtDateTime(input.at, lead.timezone ?? "America/New_York")} (${lead.timezone ?? "lead time"})`,
    });
    return id;
  });
}

export type MeetingOutcome = "held" | "no_show" | "rescheduled";

export function setMeetingOutcome(orgId: number, meetingId: number, userId: number, outcome: MeetingOutcome, opts: { newAt?: Date; notes?: string } = {}):
  { ok: true } | { ok: false; error: string } {
  const m = get<Meeting>("SELECT * FROM meetings WHERE org_id = ? AND id = ?", orgId, meetingId);
  if (!m) return { ok: false, error: "Meeting not found." };
  if (outcome === "rescheduled" && !opts.newAt) return { ok: false, error: "Pick the new date and time." };

  tx(() => {
    run("UPDATE meetings SET outcome = ?, notes = COALESCE(?, notes) WHERE id = ?", outcome, opts.notes?.trim() || null, m.id);
    const label = { held: "Meeting held", no_show: "Meeting no-show", rescheduled: "Meeting rescheduled" }[outcome];
    addActivity({ orgId, leadId: m.lead_id, dealId: m.deal_id, userId, type: "meeting", summary: label, body: opts.notes ?? null });

    if (outcome === "held" && m.deal_id) {
      const done = stageByNameOr(orgId, "Meeting done", 2);
      const cur = get<{ sort: number; kind: string }>("SELECT s.sort, s.kind FROM deals d JOIN pipeline_stages s ON s.id = d.stage_id WHERE d.id = ?", m.deal_id);
      if (done && cur && cur.kind === "open" && cur.sort < done.sort) moveDeal(orgId, m.deal_id, done.id, userId);
    }
    if (outcome === "no_show" && m.owner_id) {
      // Surface it in the owner's callbacks so the no-show gets chased.
      run(
        `INSERT INTO tasks (org_id, lead_id, user_id, type, title, due_at, lead_tz, created_by, created_at)
         VALUES (?, ?, ?, 'callback', 'No-show — call to reschedule', ?, ?, ?, ?)`,
        orgId, m.lead_id, m.owner_id, now(), m.lead_tz, userId, now(),
      );
    }
    if (outcome === "rescheduled" && opts.newAt) {
      insert(
        `INSERT INTO meetings (org_id, lead_id, deal_id, scheduled_at, lead_tz, zoom_link, attendees, owner_id, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        orgId, m.lead_id, m.deal_id, opts.newAt.toISOString(), m.lead_tz, m.zoom_link, m.attendees, m.owner_id, userId, now(),
      );
    }
  });
  return { ok: true };
}
