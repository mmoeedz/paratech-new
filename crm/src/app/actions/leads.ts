"use server";

import { redirect } from "next/navigation";
import { requireUser, requireRole, isManager, validUserId, type User } from "@/lib/auth";
import { run, now, get } from "@/lib/db";
import {
  addActivity, addDnc, audit, canSeeLead, createLead, getLead, getPhones, isBlockedPhone, refreshLeadCallability, LEAD_STATUSES, type Lead,
} from "@/lib/leads";
import { isValidTimezone, resolveZone, normalizeState } from "@/lib/geo";
import { parsePhone, nameKey } from "@/lib/phone";
import { back, int, num, str } from "@/lib/form";
import { customFromForm, listFields } from "@/lib/fields";
import { createTask } from "@/lib/tasks";
import { createDeal, openDealForLead } from "@/lib/deals";
import { createMeeting } from "@/lib/meetings";
import { datetimeLocalToUtc } from "@/lib/time";
import { reassignLead } from "@/lib/lists";
import { getSettings } from "@/lib/settings";
import { sendLeadEmail } from "@/lib/email";

async function loadLead(fd: FormData): Promise<{ user: User; lead: Lead }> {
  const user = await requireUser();
  const id = int(fd, "leadId");
  const lead = id ? getLead(user.org_id, id) : undefined;
  if (!lead || !canSeeLead(user, lead)) redirect("/leads?err=" + encodeURIComponent("Lead not found."));
  return { user, lead };
}

const leadUrl = (id: number) => `/leads/${id}`;

export async function createLeadAction(fd: FormData) {
  const user = await requireUser();
  const assigned = isManager(user) ? validUserId(user.org_id, int(fd, "assigned_to")) : user.id;
  const cf = customFromForm(listFields(user.org_id, "lead"), fd);
  const res = createLead(
    user.org_id,
    {
      business_name: str(fd, "business_name"),
      contact_name: str(fd, "contact_name"),
      phones: [str(fd, "phone"), str(fd, "phone2")].filter(Boolean),
      email: str(fd, "email"),
      website: str(fd, "website"),
      city: str(fd, "city"),
      state: str(fd, "state"),
      niche: str(fd, "niche"),
      source: str(fd, "source") || "Manual entry",
      google_rating: num(fd, "google_rating"),
      google_reviews: int(fd, "google_reviews"),
      assigned_to: assigned,
      custom: cf,
    },
    user.id,
  );
  if (!res.ok) back("/leads/new", { err: res.error });
  redirect(leadUrl(res.id) + "?ok=" + encodeURIComponent("Lead created."));
}

export async function updateLeadAction(fd: FormData) {
  const { user, lead } = await loadLead(fd);
  const name = str(fd, "business_name");
  if (!name) back(leadUrl(lead.id), { err: "Business name is required." });
  const tzChoice = str(fd, "timezone");
  const stateInput = str(fd, "state");
  const state = normalizeState(stateInput) ?? (stateInput || null);
  const firstPhone = get<{ phone: string }>("SELECT phone FROM lead_phones WHERE lead_id = ? ORDER BY bad, is_primary DESC, id LIMIT 1", lead.id)?.phone;
  let timezone = lead.timezone;
  let approx = lead.tz_approx;
  if (tzChoice === "auto") {
    const z = resolveZone({ state, phone: firstPhone });
    timezone = z.timezone;
    approx = z.approx ? 1 : 0;
  } else if (isValidTimezone(tzChoice)) {
    timezone = tzChoice;
    approx = 0;
  }
  const cf = customFromForm(listFields(user.org_id, "lead"), fd);
  run(
    `UPDATE leads SET business_name = ?, contact_name = ?, email = ?, website = ?, city = ?, state = ?, timezone = ?, tz_approx = ?,
       niche = ?, source = ?, google_rating = ?, google_reviews = ?, custom = ?, name_key = ?, updated_at = ? WHERE id = ? AND org_id = ?`,
    name, str(fd, "contact_name") || null, str(fd, "email").toLowerCase() || null, str(fd, "website") || null, str(fd, "city") || null,
    state, timezone, approx, str(fd, "niche") || null, str(fd, "source") || null, num(fd, "google_rating"), int(fd, "google_reviews"),
    JSON.stringify(cf), nameKey(name), now(), lead.id, user.org_id,
  );
  addActivity({ orgId: user.org_id, leadId: lead.id, userId: user.id, type: "edit", summary: "Lead details updated" });
  back(leadUrl(lead.id), { ok: "Saved." });
}

export async function addNoteAction(fd: FormData) {
  const { user, lead } = await loadLead(fd);
  const body = str(fd, "body");
  if (!body) back(leadUrl(lead.id), { err: "Write something first." });
  addActivity({ orgId: user.org_id, leadId: lead.id, userId: user.id, type: "note", summary: "Note", body });
  back(leadUrl(lead.id), { ok: "Note added." });
}

export async function addPhoneAction(fd: FormData) {
  const { user, lead } = await loadLead(fd);
  const p = parsePhone(str(fd, "phone"));
  if (!p.ok) back(leadUrl(lead.id), { err: `That number isn't valid (${p.reason}).` });
  if (isBlockedPhone(user.org_id, p.e164)) back(leadUrl(lead.id), { err: "That number is on the do-not-call list." });
  const exists = get<{ lead_id: number }>("SELECT lead_id FROM lead_phones WHERE org_id = ? AND phone = ?", user.org_id, p.e164);
  if (exists) back(leadUrl(lead.id), { err: exists.lead_id === lead.id ? "That number is already on this lead." : `That number already belongs to another lead (#${exists.lead_id}).` });
  run("INSERT INTO lead_phones (org_id, lead_id, phone, raw, label, created_at) VALUES (?, ?, ?, ?, ?, ?)", user.org_id, lead.id, p.e164, str(fd, "phone"), str(fd, "label") || null, now());
  if (lead.status === "dead" && lead.dead_reason === "No working number") {
    run("UPDATE leads SET status = 'new', dead_reason = NULL, updated_at = ? WHERE id = ?", now(), lead.id);
  }
  if (!lead.timezone) {
    const z = resolveZone({ state: lead.state, phone: p.e164 });
    if (z.timezone) run("UPDATE leads SET timezone = ?, tz_approx = ?, state = COALESCE(state, ?) WHERE id = ?", z.timezone, z.approx ? 1 : 0, z.state, lead.id);
  }
  addActivity({ orgId: user.org_id, leadId: lead.id, userId: user.id, type: "edit", summary: `Phone added: ${p.national}` });
  back(leadUrl(lead.id), { ok: "Number added." });
}

export async function updatePhoneAction(fd: FormData) {
  const { user, lead } = await loadLead(fd);
  const phoneId = int(fd, "phoneId");
  const type = str(fd, "phone_type");
  const bad = str(fd, "intent") === "bad";
  const unbad = str(fd, "intent") === "unbad";
  const row = get<{ id: number; phone: string }>("SELECT id, phone FROM lead_phones WHERE id = ? AND lead_id = ?", phoneId ?? 0, lead.id);
  if (!row) back(leadUrl(lead.id), { err: "Number not found." });
  if (["mobile", "landline", "voip", "unknown"].includes(type)) {
    run("UPDATE lead_phones SET phone_type = ? WHERE id = ?", type, row.id);
  }
  if (bad) {
    run("UPDATE lead_phones SET bad = 1, bad_reason = 'marked bad by user' WHERE id = ?", row.id);
    refreshLeadCallability(user.org_id, lead.id);
  }
  if (unbad) {
    if (isBlockedPhone(user.org_id, row.phone)) back(leadUrl(lead.id), { err: "That number is on the do-not-call list and can't be restored." });
    run("UPDATE lead_phones SET bad = 0, bad_reason = NULL WHERE id = ?", row.id);
    run("UPDATE leads SET status = 'new', dead_reason = NULL, updated_at = ? WHERE id = ? AND status = 'dead' AND dead_reason = 'No working number'", now(), lead.id);
  }
  back(leadUrl(lead.id), { ok: "Number updated." });
}

export async function markDncAction(fd: FormData) {
  const { user, lead } = await loadLead(fd);
  const phones = getPhones(lead.id);
  for (const p of phones) addDnc(user.org_id, p.phone, { scope: "internal", reason: str(fd, "reason") || "Marked on lead page", leadId: lead.id, userId: user.id });
  run("UPDATE leads SET status = 'dnc', dead_reason = 'Do not call', next_action_at = NULL, locked_by = NULL, locked_at = NULL, updated_at = ? WHERE id = ?", now(), lead.id);
  run("UPDATE tasks SET done_at = ? WHERE lead_id = ? AND done_at IS NULL", now(), lead.id);
  addActivity({ orgId: user.org_id, leadId: lead.id, userId: user.id, type: "dnc", summary: "Marked do-not-call — all numbers blocked" });
  audit(user.org_id, user.id, "dnc.lead", `lead ${lead.id}`);
  back(leadUrl(lead.id), { ok: "All numbers on this lead are blocked." });
}

export async function setStatusAction(fd: FormData) {
  const { user, lead } = await loadLead(fd);
  const status = str(fd, "status");
  if (!LEAD_STATUSES.some((s) => s.value === status)) back(leadUrl(lead.id), { err: "Unknown status." });
  if (status === "dnc") back(leadUrl(lead.id), { err: "Use the 'Mark do-not-call' button so the numbers are blocked." });
  if (lead.status === "dnc") back(leadUrl(lead.id), { err: "Do-not-call leads can't be reactivated." });
  run("UPDATE leads SET status = ?, next_action_at = CASE WHEN ? IN ('new','in_progress') THEN NULL ELSE next_action_at END, dead_reason = CASE WHEN ? = 'dead' THEN COALESCE(dead_reason, 'Closed manually') ELSE NULL END, updated_at = ? WHERE id = ?",
    status, status, status, now(), lead.id);
  addActivity({ orgId: user.org_id, leadId: lead.id, userId: user.id, type: "status", summary: `Status changed: ${lead.status} → ${status}` });
  back(leadUrl(lead.id), { ok: "Status updated." });
}

export async function reassignAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const id = int(fd, "leadId");
  if (!id) redirect("/leads");
  const to = int(fd, "assigned_to");
  const res = reassignLead(user.org_id, user.id, id, to, getSettings(user.org_id).lock_minutes);
  if (!res.ok) back(leadUrl(id), { err: res.error });
  back(leadUrl(id), { ok: "Reassigned." });
}

export async function toggleOptoutAction(fd: FormData) {
  const { user, lead } = await loadLead(fd);
  const next = lead.email_optout ? 0 : 1;
  run("UPDATE leads SET email_optout = ?, updated_at = ? WHERE id = ?", next, now(), lead.id);
  addActivity({ orgId: user.org_id, leadId: lead.id, userId: user.id, type: "edit", summary: next ? "Marked as opted out of email" : "Email opt-out removed" });
  back(leadUrl(lead.id), { ok: next ? "Contact will no longer be emailed." : "Email opt-out removed." });
}

export async function createTaskAction(fd: FormData) {
  const { user, lead } = await loadLead(fd);
  const title = str(fd, "title");
  const tz = lead.timezone ?? user.timezone;
  const due = datetimeLocalToUtc(str(fd, "due"), str(fd, "tz") === "lead" ? tz : user.timezone);
  if (!title || !due) back(leadUrl(lead.id), { err: "A title and due date are required." });
  const assignee = isManager(user) ? (validUserId(user.org_id, int(fd, "assignee")) ?? user.id) : user.id;
  createTask({ orgId: user.org_id, userId: assignee, createdBy: user.id, leadId: lead.id, type: "task", title, dueAt: due, leadTz: lead.timezone, notes: str(fd, "notes") });
  back(leadUrl(lead.id), { ok: "Task created." });
}

export async function createDealAction(fd: FormData) {
  const { user, lead } = await loadLead(fd);
  if (openDealForLead(user.org_id, lead.id)) back(leadUrl(lead.id), { err: "This lead already has an open deal." });
  const id = createDeal({ orgId: user.org_id, leadId: lead.id, userId: user.id, service: str(fd, "service") || null, value: num(fd, "value") ?? 0, title: str(fd, "title") || undefined });
  run("UPDATE leads SET status = CASE WHEN status IN ('new','in_progress','dead') THEN 'interested' ELSE status END, dead_reason = NULL, updated_at = ? WHERE id = ?", now(), lead.id);
  redirect(`/deals/${id}?ok=` + encodeURIComponent("Deal created."));
}

export async function scheduleMeetingAction(fd: FormData) {
  const { user, lead } = await loadLead(fd);
  const at = datetimeLocalToUtc(str(fd, "at"), lead.timezone ?? user.timezone);
  if (!at) back(leadUrl(lead.id), { err: "Pick the meeting date and time." });
  if (at.getTime() < Date.now() - 60_000) back(leadUrl(lead.id), { err: "That time is in the past." });
  const owner = isManager(user) ? (validUserId(user.org_id, int(fd, "owner")) ?? user.id) : user.id;
  createMeeting({ orgId: user.org_id, leadId: lead.id, userId: user.id, at, zoomLink: str(fd, "zoom_link"), attendees: str(fd, "attendees"), ownerId: owner });
  back(leadUrl(lead.id), { ok: "Meeting booked." });
}

export async function sendEmailAction(fd: FormData) {
  const { user, lead } = await loadLead(fd);
  const res = await sendLeadEmail(user, { leadId: lead.id, subject: str(fd, "subject"), body: str(fd, "body") });
  if (!res.ok) back(leadUrl(lead.id), { err: res.error });
  back(leadUrl(lead.id), res.status === "sent" ? { ok: "Email sent." } : { ok: res.note ?? "Draft saved." });
}
