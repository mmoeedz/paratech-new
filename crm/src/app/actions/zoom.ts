"use server";

import { requireRole } from "@/lib/auth";
import { importZoomLog, reconcile } from "@/lib/zoom";
import { back } from "@/lib/form";

export async function zoomUploadAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) back("/zoom", { err: "Choose the Zoom Phone call-log CSV." });
  if (file.size > 20 * 1024 * 1024) back("/zoom", { err: "That file is over 20 MB." });
  const res = importZoomLog(user.org_id, await file.text(), file.name);
  if (res.error) back("/zoom", { err: res.error });
  back("/zoom", { ok: `Read ${res.rows} rows: ${res.imported} new Zoom calls (${res.skipped} skipped as inbound, invalid or already imported). Matched ${res.matchedCalls} logged calls.` });
}

export async function zoomReconcileAction() {
  const user = await requireRole("admin", "team_lead");
  const n = reconcile(user.org_id);
  back("/zoom", { ok: `Re-checked. ${n} newly matched call${n === 1 ? "" : "s"}.` });
}
