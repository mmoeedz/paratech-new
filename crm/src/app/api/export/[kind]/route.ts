import { getUser, isManager } from "@/lib/auth";
import { all } from "@/lib/db";
import { allCalls } from "@/lib/calllog";
import { csvResponse, toCsv } from "@/lib/csv";
import { listLeads } from "@/lib/leads";
import { listDeals } from "@/lib/deals";
import { listMeetings } from "@/lib/meetings";
import { formatPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { kind } = await params;
  const url = new URL(req.url);
  const sp = (k: string) => url.searchParams.get(k) ?? "";
  const stamp = new Date().toISOString().slice(0, 10);

  if (kind === "calls") {
    const rows = allCalls(user, { userId: Number(sp("user")) || undefined, from: sp("from"), to: sp("to"), outcome: sp("outcome"), listId: Number(sp("list")) || undefined, q: sp("q") });
    return csvResponse(`calls-${stamp}.csv`, toCsv(
      ["When (UTC)", "Caller", "Business", "Number", "Attempt", "Outcome", "Notes", "Length (sec)", "List", "Zoom check"],
      rows.map((r) => [r.called_at, r.user_name, r.business_name, formatPhone(r.phone), r.attempt_no, r.outcome_label, r.notes, r.duration_sec, r.list_name, r.verified]),
    ));
  }

  // Everything below is manager-only bulk export (callers can already see their own leads on screen).
  if (!isManager(user)) return new Response("Forbidden", { status: 403 });

  if (kind === "leads") {
    const { rows } = listLeads(user, { pageSize: 1_000_000 });
    const phones = all<{ lead_id: number; phone: string }>("SELECT lead_id, phone FROM lead_phones WHERE org_id = ? AND bad = 0 ORDER BY is_primary DESC, id", user.org_id);
    const byLead = new Map<number, string[]>();
    for (const p of phones) byLead.set(p.lead_id, [...(byLead.get(p.lead_id) ?? []), formatPhone(p.phone)]);
    return csvResponse(`leads-${stamp}.csv`, toCsv(
      ["Business", "Contact", "Phones", "Email", "Website", "City", "State", "Time zone", "Niche", "Source", "Google rating", "Google reviews", "Status", "Attempts", "Caller", "List", "Created (UTC)"],
      rows.map((l) => [l.business_name, l.contact_name, (byLead.get(l.id) ?? []).join(" / "), l.email, l.website, l.city, l.state, l.timezone, l.niche, l.source, l.google_rating, l.google_reviews, l.status, l.attempts, l.assignee_name, l.list_name, l.created_at]),
    ));
  }
  if (kind === "deals") {
    const rows = listDeals(user.org_id);
    return csvResponse(`deals-${stamp}.csv`, toCsv(
      ["Deal", "Business", "Service", "Value", "Stage", "Owner", "Found by", "Lost reason", "Closed (UTC)", "Created (UTC)"],
      rows.map((d) => [d.title, d.business_name, d.service, d.value, d.stage_name, d.owner_name, d.finder_name, d.lost_reason, d.closed_at, d.created_at]),
    ));
  }
  if (kind === "meetings") {
    const rows = listMeetings(user.org_id);
    return csvResponse(`meetings-${stamp}.csv`, toCsv(
      ["When (UTC)", "Business", "Contact", "Zoom link", "Attendees", "Owner", "Outcome"],
      rows.map((m) => [m.scheduled_at, m.business_name, m.contact_name, m.zoom_link, m.attendees, m.owner_name, m.outcome]),
    ));
  }
  if (kind === "dnc") {
    const rows = all<{ phone: string; scope: string; reason: string | null; marked_at: string; by: string | null }>(
      "SELECT d.phone, d.scope, d.reason, d.marked_at, u.name AS by FROM dnc d LEFT JOIN users u ON u.id = d.marked_by WHERE d.org_id = ? ORDER BY d.marked_at DESC", user.org_id);
    return csvResponse(`do-not-call-${stamp}.csv`, toCsv(["Number", "List", "Reason", "Marked by", "Marked (UTC)"], rows.map((r) => [formatPhone(r.phone), r.scope, r.reason, r.by, r.marked_at])));
  }
  return new Response("Unknown export", { status: 404 });
}
