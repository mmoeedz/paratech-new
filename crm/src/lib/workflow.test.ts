import { beforeEach, describe, expect, it } from "vitest";
process.env.CRM_DB_PATH = ":memory:";
import { all, get, resetDbForTests, run } from "./db";
import { createOrganization } from "./settings";
import { createUser, type User } from "./auth";
import { addDnc, createLead, getLead, getPhones, findDuplicate } from "./leads";
import { logCall } from "./dispositions";
import { nextForCaller, workableLeadIds } from "./queue";
import { listStages, moveDeal, openDealForLead, listDeals } from "./deals";
import { zonedToUtc, addDays } from "./time";

let org: number;
let caller: User;
let other: User;

function user(id: number): User {
  return get<User>("SELECT id, org_id, email, name, role, timezone, zoom_email, active FROM users WHERE id = ?", id)!;
}

function lead(name: string, phones: string[], extra: Record<string, unknown> = {}) {
  const r = createLead(org, { business_name: name, phones, state: "NY", assigned_to: caller.id, ...extra }, null);
  if (!r.ok) throw new Error(r.error);
  return r.id;
}

/** A local datetime-local string `days` from now at a safe midday in NY. */
function nyMidday(days: number) {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(addDays(new Date(), days));
  return `${d}T12:00`;
}

beforeEach(() => {
  resetDbForTests();
  org = createOrganization("Test Org");
  caller = user(createUser({ orgId: org, email: "c@x.com", name: "Cal", password: "password123", role: "caller" }));
  other = user(createUser({ orgId: org, email: "o@x.com", name: "Olly", password: "password123", role: "caller" }));
});

describe("lead creation", () => {
  it("fills state/time zone and detects duplicates", () => {
    const id = lead("Acme Roofing LLC", ["(212) 555-0101"]);
    const l = getLead(org, id)!;
    expect(l.timezone).toBe("America/New_York");
    expect(findDuplicate(org, { phones: ["+12125550101"], business_name: "Other" })?.reason).toBe("phone");
    expect(findDuplicate(org, { phones: [], business_name: "acme roofing", state: "NY" })?.reason).toBe("name");
    // same name in another state is a different (chain) location
    expect(findDuplicate(org, { phones: [], business_name: "acme roofing", state: "CA" })).toBeNull();
  });
  it("derives state from the area code", () => {
    const r = createLead(org, { business_name: "No State Co", phones: ["310-555-0199"] }, null);
    expect(r.ok).toBe(true);
    if (r.ok) expect(getLead(org, r.id)).toMatchObject({ state: "CA", timezone: "America/Los_Angeles" });
  });
  it("rejects numbers on the DNC list", () => {
    addDnc(org, "+12125550101", { userId: caller.id });
    const r = createLead(org, { business_name: "Blocked", phones: ["212-555-0101"] }, null);
    expect(r).toMatchObject({ ok: false });
  });
});

describe("queue", () => {
  const at = new Date("2026-10-05T17:00:00Z"); // 1pm ET, 10am PT, 7am HST
  it("orders callbacks, then new leads, then retries, and hides leads outside calling hours", () => {
    const ny = lead("NY new", ["212-555-0111"]);
    const la = lead("LA new", ["310-555-0112"], { state: "CA" });
    const hi = lead("HI new", ["808-555-0113"], { state: "HI" });
    const retry = lead("NY retry", ["212-555-0114"]);
    const cb = lead("NY callback", ["212-555-0115"]);
    run("UPDATE leads SET status = 'in_progress', next_action_at = '2026-10-05T10:00:00Z' WHERE id = ?", retry);
    run("INSERT INTO tasks (org_id, lead_id, user_id, type, title, due_at, created_at) VALUES (?, ?, ?, 'callback', 'cb', '2026-10-05T16:00:00Z', ?)", org, cb, caller.id, "2026-10-01T00:00:00Z");
    const ids = workableLeadIds(caller, at).map((r) => r.id);
    expect(ids).toEqual([cb, ny, la, retry]);
    expect(ids).not.toContain(hi);
  });
  it("never shows another caller's leads and skips leads with no timezone", () => {
    createLead(org, { business_name: "Theirs", phones: ["212-555-0121"], state: "NY", assigned_to: other.id }, null);
    const unknown = createLead(org, { business_name: "No zone", phones: ["800-555-0122"], assigned_to: caller.id }, null);
    expect(unknown.ok).toBe(true);
    expect(workableLeadIds(caller, at)).toHaveLength(0);
  });
  it("hands out the same lead until it is worked", () => {
    const a = lead("A", ["212-555-0131"]);
    lead("B", ["212-555-0132"]);
    const first = nextForCaller(caller, at).lead!;
    expect(first.id).toBe(a);
    expect(nextForCaller(caller, at).lead!.id).toBe(a);
  });
});

describe("dispositions", () => {
  it("no answer schedules a 1-day retry; voicemail 2 days", () => {
    const id = lead("Retry Co", ["212-555-0141"]);
    const r = logCall(caller, { leadId: id, outcomeKey: "no_answer" });
    expect(r.ok).toBe(true);
    const l = getLead(org, id)!;
    expect(l.status).toBe("in_progress");
    expect(l.attempts).toBe(1);
    const days = (new Date(l.next_action_at!).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(0.99);
    expect(days).toBeLessThanOrEqual(1.001);
    logCall(caller, { leadId: id, outcomeKey: "voicemail" });
    const days2 = (new Date(getLead(org, id)!.next_action_at!).getTime() - Date.now()) / 86_400_000;
    expect(days2).toBeGreaterThan(1.99);
  });
  it("closes the lead after the attempt cap", () => {
    const id = lead("Capped", ["212-555-0142"]);
    for (let i = 0; i < 6; i++) logCall(caller, { leadId: id, outcomeKey: "no_answer" });
    expect(getLead(org, id)).toMatchObject({ status: "dead", attempts: 6 });
    expect(getLead(org, id)!.dead_reason).toMatch(/Max attempts/);
  });
  it("gatekeeper stores the decision maker and schedules at the best time", () => {
    const id = lead("Gate Co", ["212-555-0143"]);
    const r = logCall(caller, { leadId: id, outcomeKey: "gatekeeper", decisionMaker: "Dana Reyes", bestTime: "09:30" });
    expect(r.ok).toBe(true);
    const l = getLead(org, id)!;
    expect(l.decision_maker).toBe("Dana Reyes");
    expect(l.contact_name).toBe("Dana Reyes");
    // next day at 9:30 New York time
    const local = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(addDays(new Date(), 1));
    expect(l.next_action_at).toBe(zonedToUtc(local, "09:30", "America/New_York").toISOString());
  });
  it("wrong number marks the dialled number bad and keeps the lead if another number exists", () => {
    const id = lead("Two Phones", ["212-555-0144", "212-555-0145"]);
    logCall(caller, { leadId: id, outcomeKey: "wrong_number", phone: "+12125550144" });
    expect(getPhones(id).find((p) => p.phone === "+12125550144")!.bad).toBe(1);
    expect(getLead(org, id)!.status).toBe("in_progress");
    logCall(caller, { leadId: id, outcomeKey: "wrong_number", phone: "+12125550145" });
    expect(getLead(org, id)!.status).toBe("dead");
  });
  it("not interested needs a reason and can schedule a 90-day re-contact", () => {
    const id = lead("Nope Co", ["212-555-0146"]);
    expect(logCall(caller, { leadId: id, outcomeKey: "not_interested" })).toMatchObject({ ok: false });
    expect(getLead(org, id)!.attempts).toBe(0);
    logCall(caller, { leadId: id, outcomeKey: "not_interested", deadReason: "No budget", recontact: true });
    const l = getLead(org, id)!;
    expect(l.status).toBe("dead");
    const days = (new Date(l.recontact_at!).getTime() - Date.now()) / 86_400_000;
    expect(Math.round(days)).toBe(90);
    // once the date arrives the lead returns to the queue
    run("UPDATE leads SET recontact_at = '2020-01-01T00:00:00Z' WHERE id = ?", id);
    expect(workableLeadIds(caller, new Date("2026-10-05T17:00:00Z")).map((r) => r.id)).toContain(id);
    expect(getLead(org, id)!.status).toBe("new");
  });
  it("callbacks must be in the future and inside calling hours", () => {
    const id = lead("Call Me", ["212-555-0147"]);
    expect(logCall(caller, { leadId: id, outcomeKey: "callback" })).toMatchObject({ ok: false });
    expect(logCall(caller, { leadId: id, outcomeKey: "callback", callbackAt: "2020-01-01T12:00" })).toMatchObject({ ok: false });
    const late = nyMidday(2).replace("T12:00", "T22:30");
    expect(logCall(caller, { leadId: id, outcomeKey: "callback", callbackAt: late })).toMatchObject({ ok: false });
    const ok = logCall(caller, { leadId: id, outcomeKey: "callback", callbackAt: nyMidday(2) });
    expect(ok.ok).toBe(true);
    const t = get<{ type: string; due_at: string; lead_tz: string }>("SELECT * FROM tasks WHERE lead_id = ?", id)!;
    expect(t.type).toBe("callback");
    expect(t.lead_tz).toBe("America/New_York");
    expect(t.due_at).toBe(zonedToUtc(nyMidday(2).slice(0, 10), "12:00", "America/New_York").toISOString());
  });
  it("interested opens a deal in the first stage", () => {
    const id = lead("Hot Co", ["212-555-0148"]);
    logCall(caller, { leadId: id, outcomeKey: "interested", dealService: "Website", dealValue: 4000 });
    const deal = openDealForLead(org, id)!;
    expect(deal).toMatchObject({ value: 4000, service: "Website", found_by: caller.id });
    expect(listDeals(org)[0].stage_name).toBe("Interested");
    expect(getLead(org, id)!.status).toBe("interested");
    // a second 'interested' call must not open a second deal
    logCall(caller, { leadId: id, outcomeKey: "interested" });
    expect(listDeals(org)).toHaveLength(1);
  });
  it("meeting booked creates the meeting and a deal in the Meeting booked stage", () => {
    const id = lead("Meet Co", ["212-555-0149"]);
    expect(logCall(caller, { leadId: id, outcomeKey: "meeting_booked" })).toMatchObject({ ok: false });
    const r = logCall(caller, { leadId: id, outcomeKey: "meeting_booked", meetingAt: nyMidday(3), zoomLink: "https://zoom.us/j/1" });
    expect(r.ok).toBe(true);
    expect(getLead(org, id)!.status).toBe("meeting_booked");
    expect(get<{ n: number }>("SELECT COUNT(*) AS n FROM meetings WHERE lead_id = ?", id)!.n).toBe(1);
    expect(listDeals(org)[0].stage_name).toBe("Meeting booked");
  });
  it("do not call blocks every number permanently", () => {
    const id = lead("Angry Co", ["212-555-0150", "212-555-0151"]);
    logCall(caller, { leadId: id, outcomeKey: "dnc" });
    expect(getLead(org, id)!.status).toBe("dnc");
    expect(all("SELECT * FROM dnc WHERE org_id = ?", org)).toHaveLength(2);
    expect(createLead(org, { business_name: "Re-import", phones: ["212-555-0151"] }, null).ok).toBe(false);
    expect(logCall(caller, { leadId: id, outcomeKey: "no_answer" })).toMatchObject({ ok: false });
  });
  it("callers cannot log calls on leads that aren't theirs", () => {
    const id = lead("Mine", ["212-555-0152"]);
    expect(logCall(other, { leadId: id, outcomeKey: "no_answer" })).toMatchObject({ ok: false });
  });
});

describe("pipeline", () => {
  it("lost needs a reason; won turns the lead into a client; reopening restores it", () => {
    const id = lead("Deal Co", ["212-555-0153"]);
    logCall(caller, { leadId: id, outcomeKey: "interested" });
    const deal = openDealForLead(org, id)!;
    const stages = listStages(org);
    const lost = stages.find((s) => s.kind === "lost")!;
    const won = stages.find((s) => s.kind === "won")!;
    expect(moveDeal(org, deal.id, lost.id, caller.id)).toMatchObject({ ok: false });
    expect(moveDeal(org, deal.id, lost.id, caller.id, { reason: "No budget" })).toMatchObject({ ok: true });
    expect(getLead(org, id)!.status).toBe("dead");
    expect(moveDeal(org, deal.id, won.id, caller.id)).toMatchObject({ ok: true });
    expect(getLead(org, id)!.status).toBe("client");
    expect(listDeals(org)[0].closed_at).toBeTruthy();
    moveDeal(org, deal.id, stages[0].id, caller.id);
    expect(getLead(org, id)!.status).toBe("interested");
    expect(listDeals(org)[0].closed_at).toBeNull();
  });
});

// ---------------------------------------------------------------------------------------------
import { classifyRows, commitImport, guessMapping, type Staging } from "./imports";
import { assignList, reassignLead } from "./lists";
import { importZoomLog } from "./zoom";
import { byCaller, funnel } from "./reports";
import { isBlockedPhone } from "./leads";
import { validUserId } from "./auth";

describe("import", () => {
  const staging = (rows: string[][]): Staging => ({
    id: 1, filename: "t.csv",
    headers: ["Company", "Owner", "Phone", "State", "City"],
    rows,
  });

  it("guesses the column mapping from headers", () => {
    const m = guessMapping(["Company Name", "Owner Name", "Phone Number", "Email Address", "State", "City", "Industry", "Google Rating", "Review Count"]);
    expect(m).toMatchObject({ business_name: 0, contact_name: 1, phone: 2, email: 3, state: 4, city: 5, niche: 6, google_rating: 7, google_reviews: 8 });
  });

  it("classifies duplicates, DNC, invalid and missing names — in the DB and within the file", () => {
    lead("Existing Roofing", ["212-555-0301"], { city: "Albany" });
    addDnc(org, "+12125550302", { userId: caller.id });
    const s = staging([
      ["Fresh Roofing", "", "212-555-0303", "NY", "Albany"],
      ["Fresh Roofing LLC", "", "212-555-0399", "NY", "Albany"], // same business as row 1
      ["Another Name", "", "(212) 555-0303", "NY", "Albany"], // same phone as row 1
      ["Phone Clash", "", "212-555-0301", "NY", "Albany"], // phone already in CRM
      ["Existing Roofing", "", "212-555-0304", "NY", "Albany"], // same business already in CRM
      ["Blocked Co", "", "212-555-0302", "NY", "Albany"],
      ["Bad Phone Co", "", "12345", "NY", "Albany"],
      ["", "", "212-555-0305", "NY", "Albany"],
      ["Chain Store", "", "212-555-0306", "NY", "Albany"],
      ["Chain Store", "", "310-555-0307", "CA", "San Jose"], // same name, different place: not a duplicate
      ["Two Numbers", "", "212-555-0308 / 212-555-0302", "NY", "Albany"], // one blocked number is dropped, lead kept
    ]);
    const { rows, counts } = classifyRows(org, s, { business_name: 0, contact_name: 1, phone: 2, state: 3, city: 4 });
    expect(rows.map((r) => r.status)).toEqual(["ok", "duplicate", "duplicate", "duplicate", "duplicate", "dnc", "invalid_phone", "missing_name", "ok", "ok", "ok"]);
    expect(counts).toMatchObject({ total: 11, ok: 4, duplicate: 4, dnc: 1, invalid_phone: 1, missing_name: 1 });
    expect(rows[10].phones).toEqual(["+12125550308"]);
  });

  it("commits only clean rows and records the skipped ones", () => {
    const s = staging([
      ["Good One", "Pat", "212-555-0311", "NY", "Albany"],
      ["Good One", "", "212-555-0312", "NY", "Albany"],
      ["No Phone Co", "", "", "NY", "Albany"],
    ]);
    const res = commitImport(org, caller.id, s, { business_name: 0, contact_name: 1, phone: 2, state: 3, city: 4 }, {
      batchName: "Test batch", source: "Apollo", niche: "Roofers", listId: null, newListName: "Test list", assignTo: caller.id,
    });
    expect(res.counts).toMatchObject({ total: 3, ok: 1, duplicate: 1, invalid_phone: 1 });
    const l = all<{ business_name: string; list_id: number; batch_id: number; source: string; niche: string; assigned_to: number }>("SELECT * FROM leads WHERE batch_id = ?", res.batchId);
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ business_name: "Good One", source: "Apollo", niche: "Roofers", assigned_to: caller.id });
    expect(get<{ skipped: string }>("SELECT skipped FROM import_batches WHERE id = ?", res.batchId)!.skipped).toContain("Same business");
  });
});

describe("assignment & locking", () => {
  it("splits a list evenly, respects counts, and only reassigns when asked", () => {
    const list = get<{ id: number }>("INSERT INTO call_lists (org_id, name, created_at) VALUES (?, 'L', '2026-01-01') RETURNING id", org)!.id;
    for (let i = 0; i < 6; i++) lead(`Lead ${i}`, [`212-555-04${String(i).padStart(2, "0")}`], { list_id: list, assigned_to: null });
    run("UPDATE leads SET assigned_to = NULL WHERE list_id = ?", list);
    expect(assignList(org, caller.id, { listId: list, callerIds: [caller.id, other.id], mode: "unassigned", count: 4, lockMinutes: 20 }).moved).toBe(4);
    const mine = get<{ n: number }>("SELECT COUNT(*) AS n FROM leads WHERE list_id = ? AND assigned_to = ?", list, caller.id)!.n;
    const theirs = get<{ n: number }>("SELECT COUNT(*) AS n FROM leads WHERE list_id = ? AND assigned_to = ?", list, other.id)!.n;
    expect([mine, theirs]).toEqual([2, 2]);
    // "unassigned" never steals; "all_open" does.
    expect(assignList(org, caller.id, { listId: list, callerIds: [other.id], mode: "unassigned", count: null, lockMinutes: 20 }).moved).toBe(2);
    expect(assignList(org, caller.id, { listId: list, callerIds: [caller.id], mode: "all_open", count: null, lockMinutes: 20 }).moved).toBe(4);
  });

  it("won't take a lead another caller has open right now", () => {
    const id = lead("Busy Co", ["212-555-0450"]);
    nextForCaller(caller, new Date("2026-10-05T17:00:00Z")); // locks it for `caller`
    const manager = user(createUser({ orgId: org, email: "m@x.com", name: "Mo", password: "password123", role: "team_lead" }));
    const r = reassignLead(org, manager.id, id, other.id, 20);
    expect(r).toMatchObject({ ok: false });
    expect(getLead(org, id)!.assigned_to).toBe(caller.id);
  });
});

describe("tenant isolation", () => {
  it("does not let one organization see or use another's data", () => {
    const id = lead("Org A Lead", ["212-555-0501"]);
    const orgB = createOrganization("Org B");
    const bUser = user(createUser({ orgId: orgB, email: "b@x.com", name: "Bea", password: "password123", role: "admin" }));
    expect(getLead(orgB, id)).toBeUndefined();
    expect(validUserId(orgB, caller.id)).toBeNull();
    expect(validUserId(org, caller.id)).toBe(caller.id);
    // DNC is per organization
    addDnc(org, "+12125550502", { userId: caller.id });
    expect(isBlockedPhone(orgB, "+12125550502")).toBe(false);
    // the same phone can exist as a lead in another organization
    expect(createLead(orgB, { business_name: "Org B Lead", phones: ["212-555-0501"], state: "NY" }, bUser.id).ok).toBe(true);
    // calls can't be logged across organizations
    expect(logCall(bUser, { leadId: id, outcomeKey: "no_answer" })).toMatchObject({ ok: false });
    expect(all("SELECT id FROM outcomes WHERE org_id = ?", orgB).length).toBeGreaterThan(0);
  });
});

describe("zoom verification", () => {
  it("matches logged calls to Zoom records and flags the rest", () => {
    run("UPDATE users SET zoom_email = 'casey@zoom.test' WHERE id = ?", caller.id);
    const a = lead("Dialled Co", ["212-555-0601"]);
    const b = lead("Never Dialled Co", ["212-555-0602"]);
    logCall(caller, { leadId: a, outcomeKey: "no_answer", phone: "+12125550601" });
    logCall(caller, { leadId: b, outcomeKey: "no_answer", phone: "+12125550602" });
    const t = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
    const csv = [
      "Caller Email,Callee Number,Start Time,Duration,Direction,Recording URL",
      `casey@zoom.test,+1 212-555-0601,${t(1)},0:45,Outbound,https://zoom.test/rec/1`,
      `casey@zoom.test,+1 212-555-0699,${t(2)},0:10,Outbound,`, // dialled in Zoom but never logged
      `casey@zoom.test,+1 212-555-0601,${t(3)},0:10,Inbound,`, // inbound is ignored
    ].join("\n");
    const res = importZoomLog(org, csv, "zoom.csv");
    expect(res).toMatchObject({ imported: 2, skipped: 1, matchedCalls: 1 });
    const calls = all<{ lead_id: number; verified: string; recording_url: string | null; duration_sec: number | null }>("SELECT lead_id, verified, recording_url, duration_sec FROM calls ORDER BY lead_id");
    expect(calls.find((c) => c.lead_id === a)).toMatchObject({ verified: "matched", recording_url: "https://zoom.test/rec/1", duration_sec: 45 });
    expect(calls.find((c) => c.lead_id === b)!.verified).toBe("unmatched");
    // importing the same file again changes nothing
    expect(importZoomLog(org, csv, "zoom.csv")).toMatchObject({ imported: 0 });
  });
});

describe("reports", () => {
  it("counts the funnel and per-caller numbers for a window", () => {
    const a = lead("R1", ["212-555-0701"]);
    const b = lead("R2", ["212-555-0702"]);
    const c = lead("R3", ["212-555-0703"]);
    logCall(caller, { leadId: a, outcomeKey: "no_answer" });
    logCall(caller, { leadId: b, outcomeKey: "not_interested", deadReason: "No budget" });
    logCall(caller, { leadId: c, outcomeKey: "interested", dealService: "SEO", dealValue: 1000 });
    const deal = openDealForLead(org, c)!;
    moveDeal(org, deal.id, listStages(org).find((s) => s.kind === "won")!.id, caller.id);
    const w = { from: new Date(Date.now() - 3600_000).toISOString(), to: new Date(Date.now() + 3600_000).toISOString() };
    expect(funnel(org, w)).toMatchObject({ calls: 3, conversations: 2, interested: 1, meetings: 0, won: 1, revenue: 1000 });
    expect(byCaller(org, w).find((r) => r.user_id === caller.id)).toMatchObject({ calls: 3, won: 1, revenue: 1000 });
    expect(funnel(org, { ...w, userId: other.id })).toMatchObject({ calls: 0, won: 0 });
  });
});
