import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, isManager, listUsers } from "@/lib/auth";
import { getDeal, listStages } from "@/lib/deals";
import { optionLabels } from "@/lib/settings";
import { all } from "@/lib/db";
import { fmtDateTime } from "@/lib/time";
import { moveDealFormAction, updateDealAction } from "@/app/actions/deals";
import { Field, Flash, PageHeader, StatusBadge, money, sp } from "@/components/ui";
import { leadMeetings } from "@/lib/meetings";
import { listFields } from "@/lib/fields";
import { CustomFieldInputs } from "@/components/CustomFieldInputs";

export const dynamic = "force-dynamic";

export default async function DealPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const { id } = await params;
  const q = await searchParams;
  const deal = getDeal(user.org_id, Number(id));
  if (!deal || (user.role === "caller" && deal.owner_id !== user.id && deal.found_by !== user.id)) notFound();
  const stages = listStages(user.org_id);
  const lead = all<{ status: string; contact_name: string | null }>("SELECT status, contact_name FROM leads WHERE id = ?", deal.lead_id)[0];
  const history = all<{ id: number; summary: string; created_at: string; user_name: string | null }>(
    `SELECT a.id, a.summary, a.created_at, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id
     WHERE a.deal_id = ? ORDER BY a.created_at DESC, a.id DESC`, deal.id,
  );
  const meetings = leadMeetings(user.org_id, deal.lead_id);
  const team = isManager(user) ? listUsers(user.org_id) : [];
  const lost = stages.find((s) => s.kind === "lost");

  return (
    <>
      <PageHeader title={deal.title} subtitle={<>For <Link className="text-copper-light underline" href={`/leads/${deal.lead_id}`}>{deal.business_name}</Link> · found by {deal.finder_name ?? "—"}</>}>
        <span className={`badge ${deal.stage_kind === "won" ? "badge-ok" : deal.stage_kind === "lost" ? "badge-bad" : "badge-copper"}`}>{deal.stage_name}</span>
        {lead && <StatusBadge status={lead.status} />}
      </PageHeader>
      <Flash ok={sp(q.ok)} err={sp(q.err)} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <form action={updateDealAction} className="card card-pad grid gap-4 sm:grid-cols-2">
            <h2 className="h2 sm:col-span-2">Deal details</h2>
            <input type="hidden" name="dealId" value={deal.id} />
            <Field label="Title" className="sm:col-span-2"><input className="input" name="title" defaultValue={deal.title} required /></Field>
            <Field label="Service">
              <select className="select" name="service" defaultValue={deal.service ?? ""}>
                <option value="">—</option>
                {[...new Set([...optionLabels(user.org_id, "service"), ...(deal.service ? [deal.service] : [])])].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Value ($)"><input className="input" name="value" inputMode="decimal" defaultValue={deal.value} /></Field>
            {team.length > 0 && (
              <Field label="Closer / owner" hint="Can differ from the caller who found the lead.">
                <select className="select" name="ownerId" defaultValue={deal.owner_id ?? ""}>
                  <option value="">Unassigned</option>{team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
            )}
            <CustomFieldInputs fields={listFields(user.org_id, "deal")} values={JSON.parse(deal.custom || "{}")} />
            <div className="sm:col-span-2"><button className="btn btn-primary" type="submit">Save</button></div>
          </form>

          <form action={moveDealFormAction} className="card card-pad space-y-3">
            <h2 className="h2">Move stage</h2>
            <input type="hidden" name="dealId" value={deal.id} />
            <select className="select" name="stageId" defaultValue={deal.stage_id} aria-label="Stage">
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {lost && (
              <details className="text-sm">
                <summary className="cursor-pointer text-soft">Lost? A reason is required</summary>
                <select className="select mt-2" name="lostReason" defaultValue="" aria-label="Lost reason">
                  <option value="">Choose a reason…</option>{optionLabels(user.org_id, "lost_reason").map((r) => <option key={r}>{r}</option>)}
                </select>
                <input className="input mt-2" name="lostNotes" placeholder="Notes (optional)" />
              </details>
            )}
            <button className="btn" type="submit">Update stage</button>
            {deal.lost_reason && <p className="muted">Lost reason: {deal.lost_reason}{deal.lost_notes ? ` — ${deal.lost_notes}` : ""}</p>}
            {deal.closed_at && <p className="faint">Closed {fmtDateTime(deal.closed_at, user.timezone)}</p>}
          </form>
        </div>

        <div className="space-y-6">
          {meetings.length > 0 && (
            <section className="card card-pad">
              <h2 className="h2 mb-3">Meetings</h2>
              <ul className="space-y-2 text-sm">
                {meetings.map((m) => (
                  <li key={m.id}>📅 {fmtDateTime(m.scheduled_at, user.timezone)} <span className="badge badge-slate">{m.outcome.replace("_", " ")}</span>{m.zoom_link && <> · <a className="text-copper-light underline" href={m.zoom_link} target="_blank" rel="noreferrer noopener">Zoom</a></>}</li>
                ))}
              </ul>
            </section>
          )}
          <section className="card card-pad">
            <h2 className="h2 mb-3">History</h2>
            <ol className="space-y-3 text-sm">
              {history.map((h) => (
                <li key={h.id}>{h.summary}<div className="faint">{h.user_name ?? "System"} · {fmtDateTime(h.created_at, user.timezone)}</div></li>
              ))}
            </ol>
          </section>
          <p className="faint">Deal value {money(deal.value)}</p>
        </div>
      </div>
    </>
  );
}
