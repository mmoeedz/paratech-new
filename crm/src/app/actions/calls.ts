"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { logCall } from "@/lib/dispositions";
import { skipLead } from "@/lib/queue";
import { getLead, canSeeLead } from "@/lib/leads";
import { int, num, safePath, str } from "@/lib/form";

export type CallFormState = { error?: string } | null;

export async function logCallAction(_prev: CallFormState, fd: FormData): Promise<CallFormState> {
  const user = await requireUser();
  const leadId = int(fd, "leadId");
  if (!leadId) return { error: "Missing lead." };
  const minutes = num(fd, "durationMin");
  const reasonChoice = str(fd, "deadReason");
  const res = logCall(user, {
    leadId,
    outcomeKey: str(fd, "outcomeKey"),
    phone: str(fd, "phone") || null,
    notes: str(fd, "notes") || null,
    durationSec: minutes ? Math.round(minutes * 60) : null,
    decisionMaker: str(fd, "decisionMaker") || null,
    bestTime: str(fd, "bestTime") || null,
    deadReason: reasonChoice === "__other" ? str(fd, "deadReasonOther") : reasonChoice,
    recontact: fd.get("recontact") === "on",
    callbackAt: str(fd, "callbackAt") || null,
    dealService: str(fd, "dealService") || null,
    dealValue: num(fd, "dealValue"),
    meetingAt: str(fd, "meetingAt") || null,
    zoomLink: str(fd, "zoomLink") || null,
    attendees: str(fd, "attendees") || null,
  });
  if (!res.ok) return { error: res.error };
  const to = safePath(str(fd, "returnTo"), "/queue");
  const u = new URL(to, "http://x");
  u.searchParams.set("ok", `Saved — ${res.summary}`);
  redirect(u.pathname + u.search);
}

export async function skipLeadAction(fd: FormData) {
  const user = await requireUser();
  const id = int(fd, "leadId");
  const lead = id ? getLead(user.org_id, id) : undefined;
  if (lead && canSeeLead(user, lead)) skipLead(user.org_id, lead.id);
  redirect("/queue");
}
