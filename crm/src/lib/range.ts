import { addDays, dayBounds, zonedToUtc } from "./time";

export type Range = { from: Date; to: Date; label: string; key: string; fromDate: string; toDate: string };

const ymd = (d: Date, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);

/** Resolve a preset or a custom YYYY-MM-DD..YYYY-MM-DD span (inclusive) in the viewer's zone. */
export function resolveRange(key: string, from: string, to: string, tz: string): Range {
  const now = new Date();
  const today = dayBounds(now, tz);
  const mk = (start: Date, end: Date, label: string, k: string): Range => ({
    from: start, to: end, label, key: k, fromDate: ymd(start, tz), toDate: ymd(addDays(end, -1), tz),
  });
  if (key === "today") return mk(today.start, today.end, "Today", key);
  if (key === "yesterday") return mk(dayBounds(now, tz, -1).start, today.start, "Yesterday", key);
  if (key === "30d") return mk(dayBounds(now, tz, -29).start, today.end, "Last 30 days", key);
  if (key === "month") {
    const [y, m] = ymd(now, tz).split("-");
    return mk(zonedToUtc(`${y}-${m}-01`, "00:00", tz), today.end, "This month", key);
  }
  if (key === "custom" && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    const start = zonedToUtc(from, "00:00", tz);
    const end = addDays(zonedToUtc(to, "00:00", tz), 1);
    if (end > start) return mk(start, end, `${from} → ${to}`, "custom");
  }
  return mk(dayBounds(now, tz, -6).start, today.end, "Last 7 days", "7d");
}

export const RANGE_PRESETS = [
  { key: "today", label: "Today" }, { key: "yesterday", label: "Yesterday" }, { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" }, { key: "month", label: "This month" },
] as const;
