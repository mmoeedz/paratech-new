import { redirect } from "next/navigation";

export const str = (fd: FormData, key: string): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};

export const int = (fd: FormData, key: string): number | null => {
  const v = str(fd, key);
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

export const num = (fd: FormData, key: string): number | null => {
  const v = str(fd, key).replace(/[$,]/g, "");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const ints = (fd: FormData, key: string): number[] =>
  fd.getAll(key).map((v) => parseInt(String(v), 10)).filter((n) => Number.isFinite(n));

/** Redirect back to `path` with a flash message in the query string. */
export function back(path: string, msg: { ok?: string; err?: string }): never {
  const u = new URL(path, "http://x");
  if (msg.ok) u.searchParams.set("ok", msg.ok);
  if (msg.err) u.searchParams.set("err", msg.err);
  redirect(u.pathname + u.search);
}

/** Only allow same-site relative paths in redirects. */
export function safePath(p: string, fallback: string): string {
  return p.startsWith("/") && !p.startsWith("//") && !p.includes("\\") ? p : fallback;
}
