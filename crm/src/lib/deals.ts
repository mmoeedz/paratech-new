import "server-only";
import { all, get, insert, run, tx, now } from "./db";
import { addActivity, getLead } from "./leads";

export type Stage = { id: number; name: string; kind: "open" | "won" | "lost"; sort: number };

export type Deal = {
  id: number;
  org_id: number;
  lead_id: number;
  title: string;
  service: string | null;
  value: number;
  stage_id: number;
  owner_id: number | null;
  found_by: number | null;
  lost_reason: string | null;
  lost_notes: string | null;
  closed_at: string | null;
  custom: string;
  created_at: string;
  updated_at: string;
};

export type DealRow = Deal & {
  business_name: string;
  stage_name: string;
  stage_kind: Stage["kind"];
  owner_name: string | null;
  finder_name: string | null;
};

export const listStages = (orgId: number): Stage[] =>
  all<Stage>("SELECT id, name, kind, sort FROM pipeline_stages WHERE org_id = ? ORDER BY sort, id", orgId);

export const getStage = (orgId: number, id: number) =>
  get<Stage>("SELECT id, name, kind, sort FROM pipeline_stages WHERE org_id = ? AND id = ?", orgId, id);

export const firstOpenStage = (orgId: number) =>
  get<Stage>("SELECT id, name, kind, sort FROM pipeline_stages WHERE org_id = ? AND kind = 'open' ORDER BY sort, id LIMIT 1", orgId);

/** The stage named like `name` (case-insensitive), else the Nth open stage. */
export function stageByNameOr(orgId: number, name: string, fallbackIndex: number): Stage | undefined {
  const open = listStages(orgId).filter((s) => s.kind === "open");
  return open.find((s) => s.name.toLowerCase() === name.toLowerCase()) ?? open[Math.min(fallbackIndex, open.length - 1)];
}

const DEAL_SELECT = `
  SELECT d.*, l.business_name, s.name AS stage_name, s.kind AS stage_kind,
         o.name AS owner_name, f.name AS finder_name
  FROM deals d
  JOIN leads l ON l.id = d.lead_id
  JOIN pipeline_stages s ON s.id = d.stage_id
  LEFT JOIN users o ON o.id = d.owner_id
  LEFT JOIN users f ON f.id = d.found_by`;

export const getDeal = (orgId: number, id: number) =>
  get<DealRow>(`${DEAL_SELECT} WHERE d.org_id = ? AND d.id = ?`, orgId, id);

export function listDeals(orgId: number, scopeUserId?: number): DealRow[] {
  return all<DealRow>(
    `${DEAL_SELECT} WHERE d.org_id = ? ${scopeUserId ? "AND (d.owner_id = ? OR d.found_by = ?)" : ""} ORDER BY d.updated_at DESC`,
    ...(scopeUserId ? [orgId, scopeUserId, scopeUserId] : [orgId]),
  );
}

export function openDealForLead(orgId: number, leadId: number): Deal | undefined {
  return get<Deal>(
    `SELECT d.* FROM deals d JOIN pipeline_stages s ON s.id = d.stage_id
     WHERE d.org_id = ? AND d.lead_id = ? AND s.kind = 'open' ORDER BY d.id DESC LIMIT 1`,
    orgId, leadId,
  );
}

export function createDeal(input: {
  orgId: number; leadId: number; userId: number; stageId?: number; title?: string; service?: string | null; value?: number; ownerId?: number | null;
}): number {
  const lead = getLead(input.orgId, input.leadId);
  if (!lead) throw new Error("Lead not found");
  const stage = (input.stageId && getStage(input.orgId, input.stageId)) || firstOpenStage(input.orgId);
  if (!stage) throw new Error("No pipeline stages configured");
  const ts = now();
  const title = input.title?.trim() || `${lead.business_name}${input.service ? ` – ${input.service}` : ""}`;
  const id = insert(
    `INSERT INTO deals (org_id, lead_id, title, service, value, stage_id, owner_id, found_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.orgId, input.leadId, title, input.service?.trim() || null, input.value ?? 0, stage.id,
    input.ownerId ?? input.userId, input.userId, ts, ts,
  );
  addActivity({ orgId: input.orgId, leadId: input.leadId, dealId: id, userId: input.userId, type: "deal", summary: `Deal opened: ${title} (${stage.name})` });
  return id;
}

export type MoveResult = { ok: true } | { ok: false; error: string };

/** Move a deal to a stage. Lost needs a reason; Won/Lost stamp the close date and update the lead. */
export function moveDeal(orgId: number, dealId: number, stageId: number, userId: number, lost?: { reason?: string; notes?: string }): MoveResult {
  const deal = get<Deal>("SELECT * FROM deals WHERE org_id = ? AND id = ?", orgId, dealId);
  const stage = getStage(orgId, stageId);
  if (!deal || !stage) return { ok: false, error: "Deal or stage not found." };
  if (deal.stage_id === stage.id) return { ok: true };
  if (stage.kind === "lost" && !lost?.reason?.trim()) return { ok: false, error: "A lost reason is required." };

  const ts = now();
  tx(() => {
    const closing = stage.kind !== "open";
    run(
      `UPDATE deals SET stage_id = ?, closed_at = ?, lost_reason = ?, lost_notes = ?, updated_at = ? WHERE id = ?`,
      stage.id, closing ? ts : null,
      stage.kind === "lost" ? lost!.reason!.trim() : null,
      stage.kind === "lost" ? lost?.notes?.trim() || null : null, ts, deal.id,
    );
    if (stage.kind === "won") {
      run("UPDATE leads SET status = 'client', updated_at = ? WHERE id = ?", ts, deal.lead_id);
    } else if (stage.kind === "lost") {
      run("UPDATE leads SET status = 'dead', dead_reason = ?, updated_at = ? WHERE id = ?", `Deal lost: ${lost!.reason!.trim()}`, ts, deal.lead_id);
    } else {
      run("UPDATE leads SET status = ?, dead_reason = NULL, updated_at = ? WHERE id = ? AND status IN ('dead','client','interested','meeting_booked')",
        stage.name.toLowerCase().includes("meeting") ? "meeting_booked" : "interested", ts, deal.lead_id);
    }
    addActivity({
      orgId, leadId: deal.lead_id, dealId: deal.id, userId,
      type: "deal", summary: `Deal moved to ${stage.name}${stage.kind === "lost" ? ` — ${lost!.reason}` : ""}`,
    });
  });
  return { ok: true };
}

export function updateDeal(orgId: number, dealId: number, userId: number, patch: { title?: string; service?: string | null; value?: number; ownerId?: number | null; custom?: Record<string, string> }) {
  const deal = get<Deal>("SELECT * FROM deals WHERE org_id = ? AND id = ?", orgId, dealId);
  if (!deal) return;
  run(
    "UPDATE deals SET title = ?, service = ?, value = ?, owner_id = ?, custom = ?, updated_at = ? WHERE id = ?",
    patch.title?.trim() || deal.title,
    patch.service === undefined ? deal.service : patch.service,
    patch.value ?? deal.value,
    patch.ownerId === undefined ? deal.owner_id : patch.ownerId,
    patch.custom ? JSON.stringify(patch.custom) : deal.custom,
    now(), dealId,
  );
  addActivity({ orgId, leadId: deal.lead_id, dealId, userId, type: "deal", summary: "Deal details updated" });
}
