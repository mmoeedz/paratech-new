/** Time-zone helpers. Everything is stored in UTC; zones only matter for display and rules. */

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: string };

function partsIn(date: Date, tz: string): Parts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    weekday: "short",
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(date)) o[p.type] = p.value;
  return {
    year: +o.year, month: +o.month, day: +o.day,
    hour: +o.hour % 24, minute: +o.minute, second: +o.second,
    weekday: o.weekday,
  };
}

/** Fractional local hour (e.g. 8.5 = 8:30am) in a zone. */
export function localHour(date: Date, tz: string): number {
  const p = partsIn(date, tz);
  return p.hour + p.minute / 60;
}

export type CallWindow = { start: number; end: number; approxPad: number };

/**
 * Is `date` inside the legal calling window for a lead in `tz`?
 * Leads whose zone is only approximate (split states) get a one-hour safety
 * margin at both ends so a wrong guess can't land a call outside 8am–9pm.
 */
export function isCallableNow(date: Date, tz: string | null, approx: boolean, w: CallWindow): boolean {
  if (!tz) return false;
  const h = localHour(date, tz);
  const pad = approx ? w.approxPad : 0;
  return h >= w.start + pad && h < w.end - pad;
}

/** "Fri, Oct 3 · 4:30 PM" in a zone. */
export function fmtDateTime(iso: string | Date | null | undefined, tz: string): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(d).replace(/, (\d{1,2}:\d{2})/, " · $1");
}

export function fmtDate(iso: string | Date | null | undefined, tz: string): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", year: "numeric" }).format(d);
}

export function fmtTime(iso: string | Date, tz: string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(d);
}

/** Short zone label such as "CDT". */
export function tzAbbr(tz: string, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(at);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? tz;
}

/**
 * Convert a wall-clock time in `tz` ("2026-10-03", "14:30") to a UTC Date.
 * Works across DST by iterating the offset.
 */
export function zonedToUtc(dateStr: string, timeStr: string, tz: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi || 0, 0);
  let guess = asUtc;
  for (let i = 0; i < 3; i++) {
    const p = partsIn(new Date(guess), tz);
    const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const diff = shown - asUtc;
    if (diff === 0) break;
    guess -= diff;
  }
  return new Date(guess);
}

/** Parse a `datetime-local` value ("2026-10-03T14:30") as wall-clock time in `tz`. */
export function datetimeLocalToUtc(value: string, tz: string): Date | null {
  const m = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!m) return null;
  const d = zonedToUtc(m[1], m[2], tz);
  return isNaN(d.getTime()) ? null : d;
}

/** UTC ISO -> value for a `datetime-local` input in `tz`. */
export function utcToDatetimeLocal(iso: string | Date, tz: string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const p = partsIn(d, tz);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Start/end (UTC) of the calendar day containing `at`, as seen in `tz`. */
export function dayBounds(at: Date, tz: string, offsetDays = 0): { start: Date; end: Date } {
  const p = partsIn(at, tz);
  const base = new Date(Date.UTC(p.year, p.month - 1, p.day + offsetDays));
  const next = new Date(base.getTime() + 86_400_000);
  const ymd = (x: Date) => x.toISOString().slice(0, 10);
  return { start: zonedToUtc(ymd(base), "00:00", tz), end: zonedToUtc(ymd(next), "00:00", tz) };
}

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
