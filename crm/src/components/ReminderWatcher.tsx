"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

type Reminder = { id: number; title: string; business_name: string | null; lead_id: number | null; type: string };

/** Polls for callbacks/tasks that just came due and announces them (in-page, plus a browser notification if allowed). */
export function ReminderWatcher() {
  const [items, setItems] = useState<Reminder[]>([]);

  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      try {
        const r = await fetch("/api/reminders", { cache: "no-store" });
        if (!r.ok) return;
        const data: { reminders: Reminder[] } = await r.json();
        if (stopped || data.reminders.length === 0) return;
        setItems((cur) => [...cur, ...data.reminders.filter((n) => !cur.some((c) => c.id === n.id))]);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          for (const n of data.reminders) {
            new Notification(n.type === "callback" ? "Callback due" : "Task due", { body: n.business_name ? `${n.business_name} — ${n.title}` : n.title });
          }
        }
      } catch {
        /* offline — try again next tick */
      }
    };
    poll();
    const t = setInterval(poll, 60_000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, []);

  if (items.length === 0) return null;
  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
      {items.map((n) => (
        <div key={n.id} className="card card-pad border-copper/50 text-sm shadow-lg">
          <div className="font-medium text-copper-light">{n.type === "callback" ? "Callback due" : "Task due"}</div>
          <div className="mt-0.5">{n.business_name ?? n.title}</div>
          <div className="mt-2 flex gap-2">
            <Link className="btn btn-sm" href={n.type === "callback" ? "/queue" : "/callbacks"}>Open</Link>
            <button className="btn btn-ghost btn-sm" onClick={() => setItems((c) => c.filter((x) => x.id !== n.id))}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Small opt-in for browser notifications, shown in the sidebar (never floats over the call screen). */
export function NotifyToggle() {
  const perm = useSyncExternalStore(
    () => () => {},
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
    () => "unsupported",
  );
  const [asked, setAsked] = useState(false);
  if (perm !== "default" || asked) return null;
  return (
    <button
      className="btn btn-ghost btn-sm mt-1 w-full justify-start px-2.5 text-soft"
      onClick={async () => { await Notification.requestPermission(); setAsked(true); }}
    >
      🔔 Desktop alerts for callbacks
    </button>
  );
}
