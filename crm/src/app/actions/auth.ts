"use server";

import { redirect } from "next/navigation";
import {
  createSession, createUser, destroySession, hasAnyUser, passwordProblem, recordFailedLogin, requireUser,
  tooManyAttempts, verifyPassword, hashPassword,
} from "@/lib/auth";
import { get, run } from "@/lib/db";
import { createOrganization } from "@/lib/settings";
import { isValidTimezone } from "@/lib/geo";
import { back, str } from "@/lib/form";

export async function setupAction(fd: FormData) {
  if (hasAnyUser()) redirect("/login");
  const org = str(fd, "org");
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const tz = str(fd, "timezone");
  if (!org || !name || !/^\S+@\S+\.\S+$/.test(email)) back("/setup", { err: "Fill in every field with a valid email." });
  const problem = passwordProblem(password);
  if (problem) back("/setup", { err: problem });
  const orgId = createOrganization(org);
  const id = createUser({ orgId, email, name, password, role: "admin", timezone: isValidTimezone(tz) ? tz : "America/New_York" });
  await createSession(id);
  redirect("/settings?ok=" + encodeURIComponent("Welcome! Add your company address and invite your callers."));
}

export async function loginAction(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (tooManyAttempts(email)) back("/login", { err: "Too many failed attempts. Wait 15 minutes and try again." });
  const u = get<{ id: number; password_hash: string; active: number }>("SELECT id, password_hash, active FROM users WHERE email = ?", email);
  // Verify against a dummy hash when the user doesn't exist so timing doesn't reveal accounts.
  const ok = u ? verifyPassword(password, u.password_hash) : (verifyPassword(password, "scrypt$00$00"), false);
  if (!u || !ok || !u.active) {
    recordFailedLogin(email);
    back("/login", { err: "Incorrect email or password." });
  }
  await createSession(u.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(fd: FormData) {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const row = get<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", user.id)!;
  if (!verifyPassword(current, row.password_hash)) back("/profile", { err: "Current password is incorrect." });
  const problem = passwordProblem(next);
  if (problem) back("/profile", { err: problem });
  run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(next), user.id);
  // Sign every other device out.
  run("DELETE FROM sessions WHERE user_id = ?", user.id);
  await createSession(user.id);
  back("/profile", { ok: "Password changed." });
}

export async function updateProfileAction(fd: FormData) {
  const user = await requireUser();
  const name = str(fd, "name");
  const tz = str(fd, "timezone");
  const zoom = str(fd, "zoom_email").toLowerCase();
  if (!name) back("/profile", { err: "Name is required." });
  if (!isValidTimezone(tz)) back("/profile", { err: "Choose a valid time zone." });
  run("UPDATE users SET name = ?, timezone = ?, zoom_email = ? WHERE id = ?", name, tz, zoom || null, user.id);
  back("/profile", { ok: "Profile saved." });
}
