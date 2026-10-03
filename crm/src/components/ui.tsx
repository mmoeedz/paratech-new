import Link from "next/link";
import type { ReactNode } from "react";
import { statusLabel } from "@/lib/leads";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="muted mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Flash({ ok, err }: { ok?: string; err?: string }) {
  const msg = err || ok;
  if (!msg) return null;
  return (
    <div
      role={err ? "alert" : "status"}
      className={`mb-5 rounded-lg border px-4 py-3 text-sm ${err ? "border-bad/40 bg-bad/10 text-bad" : "border-ok/40 bg-ok/10 text-ok"}`}
    >
      {msg}
    </div>
  );
}

export function Field({ label, children, hint, className = "" }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="lbl">{label}</span>
      {children}
      {hint && <span className="faint mt-1 block">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "ok" | "warn" | "bad" }) {
  const color = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-cloud";
  return (
    <div className="card card-pad">
      <div className="faint uppercase tracking-wide">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="faint mt-1">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card card-pad muted text-center">{children}</div>;
}

const STATUS_TONE: Record<string, string> = {
  new: "badge-slate", in_progress: "badge-info", interested: "badge-ok", meeting_booked: "badge-copper",
  client: "badge-ok", dead: "badge-bad", dnc: "badge-bad",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_TONE[status] ?? "badge-slate"}`}>{statusLabel(status)}</span>;
}

export function Pager({ page, pageSize, total, base }: { page: number; pageSize: number; total: number; base: URLSearchParams }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams(base);
    q.set("page", String(p));
    return `?${q.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-soft">
      <span>Page {page} of {pages} · {total.toLocaleString()} total</span>
      <div className="flex gap-2">
        {page > 1 && <Link className="btn btn-sm" href={href(page - 1)}>Previous</Link>}
        {page < pages && <Link className="btn btn-sm" href={href(page + 1)}>Next</Link>}
      </div>
    </div>
  );
}

export const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
export const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** Pull a single string value out of Next's searchParams. */
export const sp = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const w = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-elevated" role="progressbar" aria-valuenow={w} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-copper" style={{ width: `${w}%` }} />
    </div>
  );
}
