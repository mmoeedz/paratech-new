"use server";

import { requireUser, isManager } from "@/lib/auth";
import { getMeeting, setMeetingOutcome } from "@/lib/meetings";
import { datetimeLocalToUtc } from "@/lib/time";
import { back, int, str } from "@/lib/form";

export async function meetingOutcomeAction(fd: FormData) {
  const user = await requireUser();
  const m = getMeeting(user.org_id, int(fd, "meetingId") ?? 0);
  const view = str(fd, "view") || "upcoming";
  const to = `/meetings?view=${encodeURIComponent(view)}`;
  if (!m || (!isManager(user) && m.owner_id !== user.id && m.created_by !== user.id)) back(to, { err: "Meeting not found." });
  const outcome = str(fd, "outcome");
  if (outcome !== "held" && outcome !== "no_show" && outcome !== "rescheduled") back(to, { err: "Unknown outcome." });
  const newAt = outcome === "rescheduled" ? datetimeLocalToUtc(str(fd, "newAt"), m.lead_tz ?? user.timezone) : null;
  if (newAt && newAt.getTime() < Date.now() - 60_000) back(to, { err: "The new time is in the past." });
  const res = setMeetingOutcome(user.org_id, m.id, user.id, outcome, { newAt: newAt ?? undefined, notes: str(fd, "notes") });
  back(to, res.ok ? { ok: outcome === "rescheduled" ? "Rescheduled — a new meeting was created." : outcome === "no_show" ? "Marked no-show. A callback was added for the owner." : "Marked held." } : { err: res.error });
}
