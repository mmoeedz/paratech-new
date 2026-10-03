"use server";

import { requireUser, isManager, validUserId } from "@/lib/auth";
import { getDeal, moveDeal, updateDeal } from "@/lib/deals";
import { back, int, num, safePath, str } from "@/lib/form";
import { customFromForm, listFields } from "@/lib/fields";

async function loadDeal(fd: FormData) {
  const user = await requireUser();
  const id = int(fd, "dealId");
  const deal = id ? getDeal(user.org_id, id) : undefined;
  if (!deal || (user.role === "caller" && deal.owner_id !== user.id && deal.found_by !== user.id)) back("/deals", { err: "Deal not found." });
  return { user, deal };
}

/** Used by the Kanban board (called directly from the client) and by the stage dropdown on the deal page. */
export async function moveDealAction(dealId: number, stageId: number, lostReason?: string, lostNotes?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const deal = getDeal(user.org_id, dealId);
  if (!deal || (user.role === "caller" && deal.owner_id !== user.id && deal.found_by !== user.id)) return { ok: false, error: "Deal not found." };
  return moveDeal(user.org_id, dealId, stageId, user.id, { reason: lostReason, notes: lostNotes });
}

export async function moveDealFormAction(fd: FormData) {
  const { user, deal } = await loadDeal(fd);
  const res = moveDeal(user.org_id, deal.id, int(fd, "stageId") ?? 0, user.id, { reason: str(fd, "lostReason"), notes: str(fd, "lostNotes") });
  const to = safePath(str(fd, "returnTo"), `/deals/${deal.id}`);
  back(to, res.ok ? { ok: "Stage updated." } : { err: res.error });
}

export async function updateDealAction(fd: FormData) {
  const { user, deal } = await loadDeal(fd);
  const owner = isManager(user) ? validUserId(user.org_id, int(fd, "ownerId")) : undefined;
  updateDeal(user.org_id, deal.id, user.id, { title: str(fd, "title"), service: str(fd, "service") || null, value: num(fd, "value") ?? 0, ownerId: owner, custom: customFromForm(listFields(user.org_id, "deal"), fd) });
  back(`/deals/${deal.id}`, { ok: "Deal saved." });
}
