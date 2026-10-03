"use server";

import { requireRole } from "@/lib/auth";
import { run } from "@/lib/db";
import { assignList, createList, getList } from "@/lib/lists";
import { getSettings } from "@/lib/settings";
import { back, int, ints, str } from "@/lib/form";
import { normalizeState } from "@/lib/geo";

export async function createListAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const name = str(fd, "name");
  if (!name) back("/lists", { err: "Give the list a name." });
  const id = createList(user.org_id, user.id, { name, niche: str(fd, "niche") || null, state: normalizeState(str(fd, "state")) });
  back(`/lists/${id}`, { ok: "List created. Import leads into it or move existing leads in." });
}

export async function assignListAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const listId = int(fd, "listId");
  const list = listId ? getList(user.org_id, listId) : undefined;
  if (!list) back("/lists", { err: "List not found." });
  const callerIds = ints(fd, "callers");
  if (callerIds.length === 0) back(`/lists/${list.id}`, { err: "Choose at least one caller." });
  const mode = str(fd, "mode") === "all_open" ? "all_open" : "unassigned";
  const count = str(fd, "scope") === "part" ? int(fd, "count") : null;
  if (str(fd, "scope") === "part" && (!count || count < 1)) back(`/lists/${list.id}`, { err: "Enter how many leads to assign." });
  const res = assignList(user.org_id, user.id, { listId: list.id, callerIds, mode, count, lockMinutes: getSettings(user.org_id).lock_minutes });
  back(`/lists/${list.id}`, {
    ok: `Assigned ${res.moved} lead${res.moved === 1 ? "" : "s"}${callerIds.length > 1 ? ` across ${callerIds.length} callers` : ""}.${res.skippedLocked ? ` ${res.skippedLocked} skipped — another caller has them open right now.` : ""}`,
  });
}

export async function archiveListAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const id = int(fd, "listId");
  if (id) run("UPDATE call_lists SET archived = 1 WHERE org_id = ? AND id = ?", user.org_id, id);
  back("/lists", { ok: "List archived." });
}

export async function moveLeadsToListAction(fd: FormData) {
  const user = await requireRole("admin", "team_lead");
  const listId = int(fd, "listId");
  const list = listId ? getList(user.org_id, listId) : undefined;
  if (!list) back("/lists", { err: "List not found." });
  const niche = str(fd, "niche");
  const state = normalizeState(str(fd, "state"));
  if (!niche && !state) back(`/lists/${list.id}`, { err: "Choose a niche and/or state of leads to move in." });
  const r = run(
    `UPDATE leads SET list_id = ?, updated_at = ? WHERE org_id = ? AND list_id IS NULL AND status IN ('new','in_progress')
       ${niche ? "AND niche = ?" : ""} ${state ? "AND state = ?" : ""}`,
    list.id, new Date().toISOString(), user.org_id, ...(niche ? [niche] : []), ...(state ? [state] : []),
  );
  back(`/lists/${list.id}`, { ok: `Moved ${r.changes} unlisted lead${r.changes === 1 ? "" : "s"} into this list.` });
}
