"use client";

import { useActionState, useMemo, useState } from "react";
import { logCallAction, type CallFormState } from "@/app/actions/calls";
import { datetimeLocalToUtc, tzAbbr } from "@/lib/time";

export type PanelOutcome = { key: string; label: string; action: string; color: string };
export type PanelPhone = { phone: string; display: string; bad: boolean; type: string };

const COLOR: Record<string, string> = {
  slate: "border-line-strong hover:bg-hover",
  amber: "border-warn/40 hover:bg-warn/10",
  rose: "border-bad/40 hover:bg-bad/10",
  sky: "border-info/40 hover:bg-info/10",
  emerald: "border-ok/40 hover:bg-ok/10",
};
const COLOR_ON: Record<string, string> = {
  slate: "bg-hover border-cloud/50",
  amber: "bg-warn/20 border-warn",
  rose: "bg-bad/20 border-bad",
  sky: "bg-info/20 border-info",
  emerald: "bg-ok/20 border-ok",
};

function ymdInZone(tz: string, addDays: number) {
  const d = new Date(Date.now() + addDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
}

/** "= 9:00 AM PKT (your time)" for a datetime-local value entered in the lead's zone. */
function YourTime({ value, leadTz, userTz }: { value: string; leadTz: string; userTz: string }) {
  const d = value ? datetimeLocalToUtc(value, leadTz) : null;
  if (!d) return null;
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: userTz, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return <span className="faint mt-1 block">= {fmt.format(d)} {tzAbbr(userTz, d)} your time</span>;
}

export function CallPanel({
  leadId, leadTz, userTz, outcomes, phones, deadReasons, services, returnTo = "/queue", maxAttempts, attempts, recontactDays, compact = false,
}: {
  leadId: number;
  leadTz: string | null;
  userTz: string;
  outcomes: PanelOutcome[];
  phones: PanelPhone[];
  deadReasons: string[];
  services: string[];
  returnTo?: string;
  maxAttempts: number;
  attempts: number;
  recontactDays: number;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState<CallFormState, FormData>(logCallAction, null);
  const [selected, setSelected] = useState<string | null>(null);
  const [callbackAt, setCallbackAt] = useState("");
  const [meetingAt, setMeetingAt] = useState("");
  const [reason, setReason] = useState(deadReasons[0] ?? "__other");
  const [notes, setNotes] = useState("");
  const tz = leadTz ?? "America/New_York";
  const outcome = outcomes.find((o) => o.key === selected);
  const goodPhones = phones.filter((p) => !p.bad);
  const nextAttemptCapped = attempts + 1 >= maxAttempts;

  const quick = useMemo(
    () => [
      { label: "Tomorrow 10am", at: () => `${ymdInZone(tz, 1)}T10:00` },
      { label: "In 3 days 10am", at: () => `${ymdInZone(tz, 3)}T10:00` },
      { label: "Next week 10am", at: () => `${ymdInZone(tz, 7)}T10:00` },
    ],
    [tz],
  );

  const picker = (value: string, set: (v: string) => void, name: string, quickPicks: boolean) => (
    <div>
      <label className="lbl" htmlFor={name}>Date &amp; time (lead&apos;s local time, {tz})</label>
      <input id={name} className="input" type="datetime-local" name={name} value={value} onChange={(e) => set(e.target.value)} required />
      <YourTime value={value} leadTz={tz} userTz={userTz} />
      {quickPicks && (
        <div className="mt-2 flex flex-wrap gap-2">
          {quick.map((q) => (
            <button key={q.label} type="button" className="btn btn-sm" onClick={() => set(q.at())}>{q.label}</button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="outcomeKey" value={selected ?? ""} />

      {goodPhones.length > 0 && (
        <div>
          <label className="lbl" htmlFor="phone">Number dialed</label>
          <select id="phone" name="phone" className="select" defaultValue={goodPhones[0].phone}>
            {goodPhones.map((p) => (
              <option key={p.phone} value={p.phone}>{p.display}{p.type !== "unknown" ? ` · ${p.type}` : ""}</option>
            ))}
          </select>
        </div>
      )}

      <fieldset>
        <legend className="lbl">Outcome</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {outcomes.map((o) => {
            const on = o.key === selected;
            return (
              <button
                key={o.key}
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(o.key)}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${on ? COLOR_ON[o.color] ?? COLOR_ON.slate : COLOR[o.color] ?? COLOR.slate}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {outcome && (
        <div className="space-y-3 rounded-lg border border-line bg-elevated/50 p-4">
          {outcome.action === "retry" && (
            <p className="muted">{nextAttemptCapped ? `This is attempt ${attempts + 1} of ${maxAttempts} — the lead will be closed.` : "The CRM will schedule the next attempt automatically."}</p>
          )}
          {outcome.action === "gatekeeper" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="lbl" htmlFor="decisionMaker">Decision-maker&apos;s name</label>
                  <input id="decisionMaker" name="decisionMaker" className="input" placeholder="e.g. Dana Reyes" /></div>
                <div><label className="lbl" htmlFor="bestTime">Best time to call (lead&apos;s time)</label>
                  <input id="bestTime" name="bestTime" type="time" className="input" /></div>
              </div>
              <p className="faint">A retry is scheduled for the next day at that time.</p>
            </>
          )}
          {outcome.action === "bad_number" && <p className="muted">The number selected above will be marked bad. If the lead has no working number left it is closed.</p>}
          {outcome.action === "dead" && (
            <>
              <div>
                <label className="lbl" htmlFor="deadReason">Reason</label>
                <select id="deadReason" name="deadReason" className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
                  {deadReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                  <option value="__other">Other…</option>
                </select>
              </div>
              {reason === "__other" && <input name="deadReasonOther" className="input" placeholder="Reason" required />}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="recontact" defaultChecked className="accent-copper" />
                Offer this lead again in {recontactDays} days
              </label>
            </>
          )}
          {outcome.action === "callback" && picker(callbackAt, setCallbackAt, "callbackAt", true)}
          {outcome.action === "deal" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="lbl" htmlFor="dealService">Service they want</label>
                <select id="dealService" name="dealService" className="select" defaultValue="">
                  <option value="">Not sure yet</option>
                  {services.map((s) => <option key={s}>{s}</option>)}
                </select></div>
              <div><label className="lbl" htmlFor="dealValue">Estimated value ($)</label>
                <input id="dealValue" name="dealValue" inputMode="decimal" className="input" placeholder="optional" /></div>
            </div>
          )}
          {outcome.action === "meeting" && (
            <>
              {picker(meetingAt, setMeetingAt, "meetingAt", true)}
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="lbl" htmlFor="zoomLink">Zoom meeting link</label>
                  <input id="zoomLink" name="zoomLink" type="url" className="input" placeholder="https://zoom.us/j/…" /></div>
                <div><label className="lbl" htmlFor="attendees">Who attends</label>
                  <input id="attendees" name="attendees" className="input" placeholder="Prospect + closer names" /></div>
                <div><label className="lbl" htmlFor="dealService2">Service</label>
                  <select id="dealService2" name="dealService" className="select" defaultValue="">
                    <option value="">Not sure yet</option>
                    {services.map((s) => <option key={s}>{s}</option>)}
                  </select></div>
                <div><label className="lbl" htmlFor="dealValue2">Estimated value ($)</label>
                  <input id="dealValue2" name="dealValue" inputMode="decimal" className="input" placeholder="optional" /></div>
              </div>
            </>
          )}
          {outcome.action === "dnc" && (
            <p className="text-sm text-bad">Every number on this lead is blocked permanently and can never be imported or shown in the queue again.</p>
          )}
        </div>
      )}

      <div>
        <label className="lbl" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was said? Anything the next caller should know." />
      </div>

      {!compact && (
        <div className="max-w-40">
          <label className="lbl" htmlFor="durationMin">Call length (min, optional)</label>
          <input id="durationMin" name="durationMin" inputMode="decimal" className="input" />
        </div>
      )}

      {state?.error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{state.error}</p>}

      <button type="submit" disabled={!selected || pending} className="btn btn-primary w-full py-3 text-base">
        {pending ? "Saving…" : returnTo === "/queue" ? "Save & Next →" : "Save call"}
      </button>
    </form>
  );
}
