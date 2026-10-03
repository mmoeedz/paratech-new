"use client";

import { useSyncExternalStore } from "react";
import { isCallableNow, tzAbbr } from "@/lib/time";

const TICK_MS = 15_000;
const subscribe = (cb: () => void) => {
  const t = setInterval(cb, TICK_MS);
  return () => clearInterval(t);
};
const snapshot = () => Math.floor(Date.now() / TICK_MS) * TICK_MS;

/** Live local time for a lead, with a clear in/out-of-window indicator. */
export function LeadClock({
  tz, approx, start, end, pad,
}: { tz: string | null; approx: boolean; start: number; end: number; pad: number }) {
  // 0 on the server (and first client render) so the markup matches; then it ticks.
  const tick = useSyncExternalStore(subscribe, snapshot, () => 0);
  if (!tz) return <span className="badge badge-warn">Time zone unknown</span>;
  if (!tick) return <span className="faint">…</span>;
  const now = new Date(tick);
  const ok = isCallableNow(now, tz, approx, { start, end, approxPad: pad });
  const time = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", weekday: "short" }).format(now);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-lg font-semibold tabular-nums">{time}</span>
      <span className="faint">{tzAbbr(tz, now)}{approx ? " (approx.)" : ""}</span>
      <span className={`badge ${ok ? "badge-ok" : "badge-bad"}`}>{ok ? "OK to call" : "Outside calling hours"}</span>
    </span>
  );
}
