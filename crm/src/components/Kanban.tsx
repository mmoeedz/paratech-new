"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moveDealAction } from "@/app/actions/deals";

export type KStage = { id: number; name: string; kind: "open" | "won" | "lost" };
export type KDeal = { id: number; title: string; business: string; value: number; stageId: number; owner: string | null; service: string | null };

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function Kanban({ stages, deals: initial, lostReasons }: { stages: KStage[]; deals: KDeal[]; lostReasons: string[] }) {
  const router = useRouter();
  const [deals, setDeals] = useState(initial);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [pendingLost, setPendingLost] = useState<{ dealId: number; stageId: number } | null>(null);
  const [reason, setReason] = useState(lostReasons[0] ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const move = (dealId: number, stageId: number, lost?: { reason: string; notes: string }) => {
    const prev = deals;
    setDeals((d) => d.map((x) => (x.id === dealId ? { ...x, stageId } : x)));
    setError(null);
    start(async () => {
      const res = await moveDealAction(dealId, stageId, lost?.reason, lost?.notes);
      if (!res.ok) {
        setDeals(prev);
        setError(res.error);
      } else router.refresh();
    });
  };

  const drop = (stage: KStage) => {
    setOver(null);
    const id = dragging;
    setDragging(null);
    if (id === null) return;
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.stageId === stage.id) return;
    if (stage.kind === "lost") setPendingLost({ dealId: id, stageId: stage.id });
    else move(id, stage.id);
  };

  return (
    <>
      {error && <p role="alert" className="mb-4 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((s) => {
          const col = deals.filter((d) => d.stageId === s.id);
          const sum = col.reduce((a, d) => a + d.value, 0);
          return (
            <section
              key={s.id}
              aria-label={s.name}
              onDragOver={(e) => { e.preventDefault(); setOver(s.id); }}
              onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
              onDrop={() => drop(s)}
              className={`w-64 shrink-0 rounded-xl border bg-deep p-3 transition-colors ${over === s.id ? "border-copper bg-copper/5" : "border-line"}`}
            >
              <header className="mb-3 flex items-baseline justify-between">
                <h3 className={`text-sm font-semibold ${s.kind === "won" ? "text-ok" : s.kind === "lost" ? "text-bad" : ""}`}>{s.name}</h3>
                <span className="faint tabular-nums">{col.length} · {usd(sum)}</span>
              </header>
              <ul className="min-h-16 space-y-2">
                {col.map((d) => (
                  <li
                    key={d.id}
                    draggable
                    onDragStart={() => setDragging(d.id)}
                    onDragEnd={() => { setDragging(null); setOver(null); }}
                    className={`cursor-grab rounded-lg border border-line bg-elevated p-3 text-sm active:cursor-grabbing ${dragging === d.id ? "opacity-40" : ""}`}
                  >
                    <Link href={`/deals/${d.id}`} className="font-medium hover:text-copper-light">{d.business}</Link>
                    <div className="faint mt-0.5">{d.service ?? "No service set"}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="tabular-nums">{usd(d.value)}</span>
                      <span className="faint">{d.owner ?? ""}</span>
                    </div>
                    <label className="sr-only" htmlFor={`mv-${d.id}`}>Move {d.business} to stage</label>
                    <select
                      id={`mv-${d.id}`} className="select mt-2 !py-1 text-xs" value={d.stageId}
                      onChange={(e) => {
                        const target = stages.find((x) => x.id === Number(e.target.value))!;
                        if (target.kind === "lost") setPendingLost({ dealId: d.id, stageId: target.id });
                        else move(d.id, target.id);
                      }}
                    >
                      {stages.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {pendingLost && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="lost-title">
          <div className="card card-pad w-full max-w-md space-y-3">
            <h2 id="lost-title" className="text-lg font-semibold">Why was this deal lost?</h2>
            <select className="select" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Lost reason">
              {lostReasons.map((r) => <option key={r}>{r}</option>)}
            </select>
            <textarea className="textarea min-h-16" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" aria-label="Notes" />
            <div className="flex justify-end gap-2">
              <button className="btn" onClick={() => { setPendingLost(null); setNotes(""); }}>Cancel</button>
              <button className="btn btn-danger" disabled={!reason} onClick={() => { move(pendingLost.dealId, pendingLost.stageId, { reason, notes }); setPendingLost(null); setNotes(""); }}>Mark lost</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
