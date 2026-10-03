"use server";

import { requireUser, isManager, validUserId } from "@/lib/auth";
import { completeTask, createTask, getTask } from "@/lib/tasks";
import { datetimeLocalToUtc } from "@/lib/time";
import { back, int, safePath, str } from "@/lib/form";
import { getLead, canSeeLead } from "@/lib/leads";

export async function completeTaskAction(fd: FormData) {
  const user = await requireUser();
  const id = int(fd, "taskId");
  const to = safePath(str(fd, "returnTo"), "/callbacks");
  const t = id ? getTask(user.org_id, id) : undefined;
  if (!t || (t.user_id !== user.id && !isManager(user))) back(to, { err: "Task not found." });
  completeTask(user.org_id, t.id, user.id);
  back(to, { ok: "Marked done." });
}

export async function createGeneralTaskAction(fd: FormData) {
  const user = await requireUser();
  const title = str(fd, "title");
  const due = datetimeLocalToUtc(str(fd, "due"), user.timezone);
  if (!title || !due) back("/callbacks", { err: "A title and due date/time are required." });
  const leadId = int(fd, "leadId");
  const lead = leadId ? getLead(user.org_id, leadId) : undefined;
  if (leadId && (!lead || !canSeeLead(user, lead))) back("/callbacks", { err: "That lead wasn't found." });
  const assignee = isManager(user) ? (validUserId(user.org_id, int(fd, "assignee")) ?? user.id) : user.id;
  createTask({ orgId: user.org_id, userId: assignee, createdBy: user.id, leadId: lead?.id ?? null, type: "task", title, dueAt: due, leadTz: lead?.timezone ?? null, notes: str(fd, "notes") });
  back("/callbacks", { ok: "Task created." });
}
