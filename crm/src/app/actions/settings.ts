"use server";

import { requireRole, createUser, hashPassword, passwordProblem } from "@/lib/auth";
import { all, get, insert, run } from "@/lib/db";
import { addOption, OPTION_KINDS, OUTCOME_ACTIONS, removeOption, setSetting, type OptionKind } from "@/lib/settings";
import { addField, removeField } from "@/lib/fields";
import { audit } from "@/lib/leads";
import { isValidTimezone } from "@/lib/geo";
import { back, int, str } from "@/lib/form";

const to = (tab: string) => `/settings?tab=${tab}`;

export async function saveGeneralAction(fd: FormData) {
  const user = await requireRole("admin");
  const start = int(fd, "calling_start_hour");
  const end = int(fd, "calling_end_hour");
  if (start === null || end === null || start < 0 || end > 24 || start >= end) back(to("general"), { err: "Calling hours must be a valid window, e.g. 8 to 21." });
  // The legal ceiling is 8am–9pm local time; admins may narrow the window but not widen it.
  if (start < 8 || end > 21) back(to("general"), { err: "US telemarketing rules (TCPA) only allow calls between 8am and 9pm in the called party's time — the window can be narrower, not wider." });
  const max = int(fd, "max_attempts");
  if (!max || max < 1 || max > 30) back(to("general"), { err: "Maximum attempts must be between 1 and 30." });
  const recontact = int(fd, "recontact_days");
  if (!recontact || recontact < 1 || recontact > 730) back(to("general"), { err: "Re-contact days must be between 1 and 730." });
  const pad = int(fd, "approx_pad_hours");
  setSetting(user.org_id, "calling_start_hour", start);
  setSetting(user.org_id, "calling_end_hour", end);
  setSetting(user.org_id, "approx_pad_hours", pad !== null && pad >= 0 && pad <= 3 ? pad : 1);
  setSetting(user.org_id, "max_attempts", max);
  setSetting(user.org_id, "recontact_days", recontact);
  setSetting(user.org_id, "lock_minutes", Math.min(240, Math.max(1, int(fd, "lock_minutes") ?? 20)));
  setSetting(user.org_id, "block_national_dnc", fd.get("block_national_dnc") === "on" ? 1 : 0);
  setSetting(user.org_id, "company_name", str(fd, "company_name") || "ParaTech");
  setSetting(user.org_id, "company_address", str(fd, "company_address"));
  setSetting(user.org_id, "reply_to_email", str(fd, "reply_to_email"));
  audit(user.org_id, user.id, "settings.general");
  back(to("general"), { ok: "Settings saved." });
}

export async function addOptionAction(fd: FormData) {
  const user = await requireRole("admin");
  const kind = str(fd, "kind") as OptionKind;
  const label = str(fd, "label");
  if (!OPTION_KINDS.some((k) => k.kind === kind) || !label) back(to("lists"), { err: "Enter a value." });
  addOption(user.org_id, kind, label);
  back(to("lists"), { ok: "Added." });
}

export async function removeOptionAction(fd: FormData) {
  const user = await requireRole("admin");
  const id = int(fd, "id");
  if (id) removeOption(user.org_id, id);
  back(to("lists"), { ok: "Removed." });
}

export async function saveOutcomeAction(fd: FormData) {
  const user = await requireRole("admin");
  const id = int(fd, "id");
  const label = str(fd, "label");
  if (!label) back(to("outcomes"), { err: "Outcome needs a name." });
  const retry = int(fd, "retry_days");
  if (retry !== null && (retry < 0 || retry > 365)) back(to("outcomes"), { err: "Retry gap must be 0–365 days." });
  const action = str(fd, "action");
  if (!(OUTCOME_ACTIONS as readonly string[]).includes(action)) back(to("outcomes"), { err: "Unknown action." });
  if (id) {
    run("UPDATE outcomes SET label = ?, action = ?, retry_days = ?, is_conversation = ?, active = ?, sort = ?, color = ? WHERE org_id = ? AND id = ?",
      label, action, retry, fd.get("is_conversation") === "on" ? 1 : 0, fd.get("active") === "on" ? 1 : 0, int(fd, "sort") ?? 50, str(fd, "color") || "slate", user.org_id, id);
  } else {
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "outcome";
    let k = key;
    for (let i = 2; get("SELECT 1 FROM outcomes WHERE org_id = ? AND key = ?", user.org_id, k); i++) k = `${key}_${i}`;
    insert("INSERT INTO outcomes (org_id, key, label, action, retry_days, is_conversation, color, sort, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
      user.org_id, k, label, action, retry, fd.get("is_conversation") === "on" ? 1 : 0, str(fd, "color") || "slate", int(fd, "sort") ?? 50);
  }
  audit(user.org_id, user.id, "settings.outcome", label);
  back(to("outcomes"), { ok: "Outcome saved." });
}

export async function saveStageAction(fd: FormData) {
  const user = await requireRole("admin");
  const id = int(fd, "id");
  const name = str(fd, "name");
  const kind = str(fd, "kind");
  if (!name || !["open", "won", "lost"].includes(kind)) back(to("pipeline"), { err: "A stage needs a name and a type." });
  if (id) {
    // Keep at least one open, one won and one lost stage.
    const stages = all<{ id: number; kind: string }>("SELECT id, kind FROM pipeline_stages WHERE org_id = ?", user.org_id);
    const after = stages.map((s) => (s.id === id ? { ...s, kind } : s));
    for (const k of ["open", "won", "lost"]) if (!after.some((s) => s.kind === k)) back(to("pipeline"), { err: `The pipeline needs at least one ${k} stage.` });
    run("UPDATE pipeline_stages SET name = ?, kind = ?, sort = ? WHERE org_id = ? AND id = ?", name, kind, int(fd, "sort") ?? 50, user.org_id, id);
  } else {
    insert("INSERT INTO pipeline_stages (org_id, name, kind, sort) VALUES (?, ?, ?, ?)", user.org_id, name, kind, int(fd, "sort") ?? 50);
  }
  back(to("pipeline"), { ok: "Stage saved." });
}

export async function deleteStageAction(fd: FormData) {
  const user = await requireRole("admin");
  const id = int(fd, "id");
  if (!id) back(to("pipeline"), { err: "Stage not found." });
  const stage = get<{ kind: string }>("SELECT kind FROM pipeline_stages WHERE org_id = ? AND id = ?", user.org_id, id);
  if (!stage) back(to("pipeline"), { err: "Stage not found." });
  if (get("SELECT 1 FROM deals WHERE stage_id = ?", id)) back(to("pipeline"), { err: "Move the deals out of this stage first." });
  const same = get<{ n: number }>("SELECT COUNT(*) AS n FROM pipeline_stages WHERE org_id = ? AND kind = ?", user.org_id, stage.kind)!.n;
  if (same <= 1) back(to("pipeline"), { err: `The pipeline needs at least one ${stage.kind} stage.` });
  run("DELETE FROM pipeline_stages WHERE org_id = ? AND id = ?", user.org_id, id);
  back(to("pipeline"), { ok: "Stage deleted." });
}

export async function addFieldAction(fd: FormData) {
  const user = await requireRole("admin");
  const label = str(fd, "label");
  const entity = str(fd, "entity") === "deal" ? "deal" : "lead";
  const type = str(fd, "type") as "text" | "number" | "date" | "select" | "yesno";
  if (!label || !["text", "number", "date", "select", "yesno"].includes(type)) back(to("fields"), { err: "Give the field a name and type." });
  addField(user.org_id, { entity, label, type, options: str(fd, "options") });
  back(to("fields"), { ok: "Field added." });
}

export async function removeFieldAction(fd: FormData) {
  const user = await requireRole("admin");
  const id = int(fd, "id");
  if (id) removeField(user.org_id, id);
  back(to("fields"), { ok: "Field removed." });
}

export async function addUserAction(fd: FormData) {
  const user = await requireRole("admin");
  const email = str(fd, "email").toLowerCase();
  const name = str(fd, "name");
  const password = String(fd.get("password") ?? "");
  const role = str(fd, "role");
  const tz = str(fd, "timezone");
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) back(to("team"), { err: "Enter a name and a valid email." });
  if (!["admin", "team_lead", "caller"].includes(role)) back(to("team"), { err: "Choose a role." });
  const problem = passwordProblem(password);
  if (problem) back(to("team"), { err: problem });
  if (get("SELECT 1 FROM users WHERE email = ?", email)) back(to("team"), { err: "That email already has an account." });
  createUser({ orgId: user.org_id, email, name, password, role: role as "admin" | "team_lead" | "caller", timezone: isValidTimezone(tz) ? tz : "America/New_York" });
  audit(user.org_id, user.id, "user.create", `${email} (${role})`);
  back(to("team"), { ok: `${name} can now sign in with the password you set.` });
}

export async function updateUserAction(fd: FormData) {
  const admin = await requireRole("admin");
  const id = int(fd, "id");
  const target = id ? get<{ id: number; role: string; active: number }>("SELECT id, role, active FROM users WHERE org_id = ? AND id = ?", admin.org_id, id) : undefined;
  if (!target) back(to("team"), { err: "User not found." });
  const role = str(fd, "role");
  const active = fd.get("active") === "on" ? 1 : 0;
  if (!["admin", "team_lead", "caller"].includes(role)) back(to("team"), { err: "Choose a role." });
  const losesAdmin = target.role === "admin" && (role !== "admin" || !active);
  if (losesAdmin) {
    const others = get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE org_id = ? AND role = 'admin' AND active = 1 AND id != ?", admin.org_id, target.id)!.n;
    if (others === 0) back(to("team"), { err: "There must always be at least one active admin." });
  }
  run("UPDATE users SET role = ?, active = ? WHERE id = ?", role, active, target.id);
  if (!active) run("DELETE FROM sessions WHERE user_id = ?", target.id);
  // Leads of a deactivated caller go back to the pool.
  if (!active) run("UPDATE leads SET assigned_to = NULL, locked_by = NULL, locked_at = NULL WHERE org_id = ? AND assigned_to = ? AND status IN ('new','in_progress')", admin.org_id, target.id);
  audit(admin.org_id, admin.id, "user.update", `user ${target.id}: ${role}, active=${active}`);
  back(to("team"), { ok: "User updated." });
}

export async function resetPasswordAction(fd: FormData) {
  const admin = await requireRole("admin");
  const id = int(fd, "id");
  const password = String(fd.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) back(to("team"), { err: problem });
  const target = id ? get<{ id: number }>("SELECT id FROM users WHERE org_id = ? AND id = ?", admin.org_id, id) : undefined;
  if (!target) back(to("team"), { err: "User not found." });
  run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(password), target.id);
  run("DELETE FROM sessions WHERE user_id = ?", target.id);
  audit(admin.org_id, admin.id, "user.password_reset", `user ${target.id}`);
  back(to("team"), { ok: "Password reset. They've been signed out everywhere." });
}
