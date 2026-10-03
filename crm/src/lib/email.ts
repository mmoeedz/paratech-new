import "server-only";
import { Resend } from "resend";
import { all, get, insert, now } from "./db";
import { addActivity, getLead, type Lead } from "./leads";
import { getSettings } from "./settings";
import { fmtDateTime } from "./time";
import type { User } from "./auth";

export type Template = { id: number; name: string; subject: string; body: string };

export const listTemplates = (orgId: number) =>
  all<Template>("SELECT id, name, subject, body FROM email_templates WHERE org_id = ? ORDER BY name", orgId);

export const getTemplate = (orgId: number, id: number) =>
  get<Template>("SELECT id, name, subject, body FROM email_templates WHERE org_id = ? AND id = ?", orgId, id);

export const TEMPLATE_VARS = ["contact_name", "business_name", "caller_name", "niche", "city", "meeting_details"] as const;

/** Replace {{vars}}; unknown or empty values collapse so "Hi {{contact_name}}," becomes "Hi there,". */
export function renderTemplate(text: string, lead: Lead, user: Pick<User, "name" | "timezone">, extra: Record<string, string> = {}): string {
  const vars: Record<string, string> = {
    contact_name: lead.contact_name?.split(" ")[0] || "there",
    business_name: lead.business_name,
    caller_name: user.name,
    niche: lead.niche?.toLowerCase() || "local",
    city: lead.city || "your area",
    reviews: lead.google_reviews ? String(lead.google_reviews) : "plenty of",
    meeting_details: extra.meeting_details ?? "",
    ...extra,
  };
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => vars[k] ?? "");
}

export function nextMeetingDetails(orgId: number, leadId: number, tz: string): string {
  const m = get<{ scheduled_at: string; zoom_link: string | null }>(
    "SELECT scheduled_at, zoom_link FROM meetings WHERE org_id = ? AND lead_id = ? AND outcome = 'pending' ORDER BY scheduled_at LIMIT 1",
    orgId, leadId,
  );
  if (!m) return "";
  return `We're set for ${fmtDateTime(m.scheduled_at, tz)} (${tz})${m.zoom_link ? `. Join here: ${m.zoom_link}` : "."}`;
}

/** CAN-SPAM: sender identity, a physical postal address and a working opt-out on every message. */
export function withComplianceFooter(body: string, company: string, address: string): string {
  return `${body.trimEnd()}\n\n--\n${company}\n${address}\nIf you'd rather not hear from us again, just reply "unsubscribe" and we'll stop right away.`;
}

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

export type SendResult = { ok: true; status: "sent" | "not_sent"; note?: string } | { ok: false; error: string };

export async function sendLeadEmail(user: User, input: { leadId: number; subject: string; body: string }): Promise<SendResult> {
  const lead = getLead(user.org_id, input.leadId);
  if (!lead) return { ok: false, error: "Lead not found." };
  if (user.role === "caller" && lead.assigned_to !== user.id) return { ok: false, error: "This lead isn't assigned to you." };
  if (!lead.email) return { ok: false, error: "This lead has no email address." };
  if (lead.email_optout) return { ok: false, error: "This contact opted out of email." };
  if (lead.status === "dnc") return { ok: false, error: "This lead is on the do-not-call list." };
  if (!input.subject.trim() || !input.body.trim()) return { ok: false, error: "Subject and message are required." };

  const s = getSettings(user.org_id);
  if (!s.company_address.trim()) {
    return { ok: false, error: "Add your company's postal address in Settings → General first — every commercial email must include one (CAN-SPAM)." };
  }
  const text = withComplianceFooter(input.body, s.company_name, s.company_address);
  const log = (status: string, error?: string) =>
    insert(
      "INSERT INTO email_log (org_id, lead_id, user_id, to_email, subject, body, status, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      user.org_id, lead.id, user.id, lead.email!, input.subject.trim(), text, status, error ?? null, now(),
    );

  if (!emailConfigured()) {
    log("not_sent", "RESEND_API_KEY is not configured");
    addActivity({ orgId: user.org_id, leadId: lead.id, userId: user.id, type: "email", summary: `Email drafted (not sent — email provider not configured): ${input.subject.trim()}` });
    return { ok: true, status: "not_sent", note: "No email provider is configured, so nothing was sent. The draft is saved on the timeline." };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.CRM_FROM_EMAIL || "ParaTech <onboarding@resend.dev>",
      to: lead.email,
      replyTo: s.reply_to_email || user.email,
      subject: input.subject.trim(),
      text,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    log("failed", msg);
    return { ok: false, error: `Email failed to send: ${msg}` };
  }
  log("sent");
  addActivity({ orgId: user.org_id, leadId: lead.id, userId: user.id, type: "email", summary: `Email sent: ${input.subject.trim()}`, body: text });
  return { ok: true, status: "sent" };
}
