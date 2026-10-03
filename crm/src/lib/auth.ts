import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { all, get, insert, run, now } from "./db";

export type Role = "admin" | "team_lead" | "caller";

export type User = {
  id: number;
  org_id: number;
  email: string;
  name: string;
  role: Role;
  timezone: string;
  zoom_email: string | null;
  active: number;
};

const COOKIE = "pt_session";
const SESSION_DAYS = 14;

// ------------------------------------------------------------ passwords

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Include letters and at least one number.";
  return null;
}

// ------------------------------------------------------------ login throttling

const MAX_FAILS = 8;
const FAIL_WINDOW_MIN = 15;

export function tooManyAttempts(email: string): boolean {
  const since = new Date(Date.now() - FAIL_WINDOW_MIN * 60_000).toISOString();
  const r = get<{ n: number }>("SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND at > ?", email, since);
  return (r?.n ?? 0) >= MAX_FAILS;
}

export function recordFailedLogin(email: string) {
  run("INSERT INTO login_attempts (email, at) VALUES (?, ?)", email, now());
  run("DELETE FROM login_attempts WHERE at < ?", new Date(Date.now() - 24 * 3600_000).toISOString());
}

// ------------------------------------------------------------ sessions

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  run("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)", sha(token), userId, expires.toISOString(), now());
  run("DELETE FROM sessions WHERE expires_at < ?", now());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", sha(token));
  jar.delete(COOKIE);
}

export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return (
    get<User>(
      `SELECT u.id, u.org_id, u.email, u.name, u.role, u.timezone, u.zoom_email, u.active
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`,
      sha(token), now(),
    ) ?? null
  );
}

export async function requireUser(): Promise<User> {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}

/** Require one of the given roles; otherwise bounce to the dashboard. */
export async function requireRole(...roles: Role[]): Promise<User> {
  const u = await requireUser();
  if (!roles.includes(u.role)) redirect("/dashboard?denied=1");
  return u;
}

export const isManager = (u: Pick<User, "role">) => u.role === "admin" || u.role === "team_lead";

// ------------------------------------------------------------ users

export function hasAnyUser(): boolean {
  return !!get("SELECT 1 FROM users LIMIT 1");
}

export function createUser(input: {
  orgId: number; email: string; name: string; password: string; role: Role; timezone?: string; zoomEmail?: string | null;
}): number {
  return insert(
    `INSERT INTO users (org_id, email, name, password_hash, role, timezone, zoom_email, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    input.orgId, input.email.trim().toLowerCase(), input.name.trim(), hashPassword(input.password),
    input.role, input.timezone ?? "America/New_York", input.zoomEmail?.trim().toLowerCase() || null, now(),
  );
}

export function listUsers(orgId: number, opts: { includeInactive?: boolean; role?: Role } = {}): User[] {
  return all<User>(
    `SELECT id, org_id, email, name, role, timezone, zoom_email, active FROM users
     WHERE org_id = ? ${opts.includeInactive ? "" : "AND active = 1"} ${opts.role ? "AND role = ?" : ""}
     ORDER BY name`,
    ...(opts.role ? [orgId, opts.role] : [orgId]),
  );
}

/** `id` if it names an active user of this organization, otherwise null (guards against cross-tenant ids). */
export function validUserId(orgId: number, id: number | null | undefined): number | null {
  if (!id) return null;
  return get<{ id: number }>("SELECT id FROM users WHERE id = ? AND org_id = ? AND active = 1", id, orgId)?.id ?? null;
}
