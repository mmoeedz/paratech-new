import "server-only";
import { all, get, insert, run, tx, now } from "./db";

export const DEFAULT_SETTINGS = {
  /** Local-time calling window for the called party (TCPA: 8am–9pm). */
  calling_start_hour: 8,
  calling_end_hour: 21,
  /** Extra margin applied when a lead's time zone is only approximate. */
  approx_pad_hours: 1,
  /** Attempt cap per lead. */
  max_attempts: 6,
  /** Days before a "Not interested" lead is offered for re-contact. */
  recontact_days: 90,
  /** Minutes a lead stays reserved for the caller who opened it. */
  lock_minutes: 20,
  block_national_dnc: 1,
  company_name: "ParaTech",
  company_address: "",
  reply_to_email: "",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export type Settings = { [K in SettingKey]: (typeof DEFAULT_SETTINGS)[K] extends number ? number : string };

export function getSettings(orgId: number): Settings {
  const out: Record<string, string | number> = { ...DEFAULT_SETTINGS };
  for (const r of all<{ key: string; value: string }>("SELECT key, value FROM settings WHERE org_id = ?", orgId)) {
    if (!(r.key in DEFAULT_SETTINGS)) continue;
    const def = DEFAULT_SETTINGS[r.key as SettingKey];
    out[r.key] = typeof def === "number" ? Number(JSON.parse(r.value)) : String(JSON.parse(r.value));
  }
  return out as unknown as Settings;
}

export function setSetting(orgId: number, key: SettingKey, value: string | number) {
  run(
    `INSERT INTO settings (org_id, key, value) VALUES (?, ?, ?)
     ON CONFLICT(org_id, key) DO UPDATE SET value = excluded.value`,
    orgId, key, JSON.stringify(value),
  );
}

// ---------------------------------------------------------------- options

export type OptionKind = "niche" | "lost_reason" | "service" | "source" | "dead_reason";

export const OPTION_KINDS: { kind: OptionKind; title: string; hint: string }[] = [
  { kind: "niche", title: "Niches / industries", hint: "Used on leads, call lists and scripts." },
  { kind: "service", title: "Services offered", hint: "What a deal is for (Website, SEO, AI Automation…)." },
  { kind: "lost_reason", title: "Lost reasons", hint: "Required when a deal is marked Lost." },
  { kind: "dead_reason", title: "Not-interested reasons", hint: "Asked when a lead says no." },
  { kind: "source", title: "Lead sources", hint: "Apollo, Google Maps, purchased list…" },
];

export function listOptions(orgId: number, kind: OptionKind): { id: number; label: string }[] {
  return all("SELECT id, label FROM options WHERE org_id = ? AND kind = ? ORDER BY sort, label", orgId, kind);
}

export function optionLabels(orgId: number, kind: OptionKind): string[] {
  return listOptions(orgId, kind).map((o) => o.label);
}

export function addOption(orgId: number, kind: OptionKind, label: string) {
  const max = get<{ m: number | null }>("SELECT MAX(sort) AS m FROM options WHERE org_id = ? AND kind = ?", orgId, kind);
  run("INSERT OR IGNORE INTO options (org_id, kind, label, sort) VALUES (?, ?, ?, ?)", orgId, kind, label.trim(), (max?.m ?? 0) + 1);
}

export function removeOption(orgId: number, id: number) {
  run("DELETE FROM options WHERE org_id = ? AND id = ?", orgId, id);
}

// ---------------------------------------------------------------- outcomes

/**
 * What the CRM does when a call ends with this outcome.
 *  retry        schedule another attempt `retry_days` later
 *  gatekeeper   capture decision-maker + best time, then retry
 *  bad_number   mark the dialled number bad
 *  dead         close the lead (with a reason, optional re-contact)
 *  callback     ask for a date/time and create a callback
 *  deal         open a deal in the first pipeline stage
 *  meeting      open the meeting form
 *  dnc          block the lead's numbers permanently
 */
export const OUTCOME_ACTIONS = [
  "retry", "gatekeeper", "bad_number", "dead", "callback", "deal", "meeting", "dnc",
] as const;
export type OutcomeAction = (typeof OUTCOME_ACTIONS)[number];

export type Outcome = {
  id: number;
  key: string;
  label: string;
  action: OutcomeAction;
  retry_days: number | null;
  is_conversation: number;
  color: string;
  sort: number;
  active: number;
};

export function listOutcomes(orgId: number, includeInactive = false): Outcome[] {
  return all<Outcome>(
    `SELECT * FROM outcomes WHERE org_id = ? ${includeInactive ? "" : "AND active = 1"} ORDER BY sort, id`,
    orgId,
  );
}

// ---------------------------------------------------------------- defaults for a new org

const DEFAULT_OUTCOMES: Omit<Outcome, "id">[] = [
  { key: "no_answer", label: "No answer", action: "retry", retry_days: 1, is_conversation: 0, color: "slate", sort: 1, active: 1 },
  { key: "voicemail", label: "Left voicemail", action: "retry", retry_days: 2, is_conversation: 0, color: "slate", sort: 2, active: 1 },
  { key: "gatekeeper", label: "Gatekeeper", action: "gatekeeper", retry_days: 1, is_conversation: 0, color: "amber", sort: 3, active: 1 },
  { key: "wrong_number", label: "Wrong number / disconnected", action: "bad_number", retry_days: null, is_conversation: 0, color: "rose", sort: 4, active: 1 },
  { key: "not_interested", label: "Not interested", action: "dead", retry_days: null, is_conversation: 1, color: "rose", sort: 5, active: 1 },
  { key: "callback", label: "Call back later", action: "callback", retry_days: null, is_conversation: 1, color: "sky", sort: 6, active: 1 },
  { key: "interested", label: "Interested", action: "deal", retry_days: null, is_conversation: 1, color: "emerald", sort: 7, active: 1 },
  { key: "meeting_booked", label: "Meeting booked", action: "meeting", retry_days: null, is_conversation: 1, color: "emerald", sort: 8, active: 1 },
  { key: "dnc", label: "Do not call", action: "dnc", retry_days: null, is_conversation: 0, color: "rose", sort: 9, active: 1 },
];

const DEFAULT_STAGES: { name: string; kind: "open" | "won" | "lost" }[] = [
  { name: "Interested", kind: "open" },
  { name: "Meeting booked", kind: "open" },
  { name: "Meeting done", kind: "open" },
  { name: "Proposal sent", kind: "open" },
  { name: "Negotiation", kind: "open" },
  { name: "Won", kind: "won" },
  { name: "Lost", kind: "lost" },
];

const DEFAULT_OPTIONS: Record<OptionKind, string[]> = {
  niche: ["Roofers", "Dentists", "Real estate agents", "HVAC", "Plumbers", "Law firms", "Restaurants"],
  service: ["Website", "SEO", "Google Ads", "AI Automation", "Custom software", "CRM setup"],
  lost_reason: ["Price too high", "Went with a competitor", "No budget", "Bad timing", "No response", "Not a fit"],
  dead_reason: ["Already have a website", "No budget", "Not the right time", "Happy with current provider", "Not the decision-maker", "Asked not to be contacted"],
  source: ["Apollo", "Google Maps", "Purchased list", "Referral", "Manual entry"],
};

const DEFAULT_SCRIPTS: { niche: string | null; kind: "opening" | "objection"; title: string; body: string }[] = [
  {
    niche: null, kind: "opening", title: "Default opening",
    body: "Hi {{contact_name}}, this is {{caller_name}} from ParaTech. I know I'm calling out of the blue — do you have 30 seconds? We help {{niche}} businesses like {{business_name}} get more customers online with websites and AI automation. I noticed {{business_name}} has {{reviews}} Google reviews, which is great, and I wanted to ask how most of your new customers find you today.",
  },
  {
    niche: "Roofers", kind: "opening", title: "Roofers opening",
    body: "Hi {{contact_name}}, {{caller_name}} from ParaTech. Quick question — when someone in {{city}} searches for a roofer after a storm, does {{business_name}} show up near the top? We build sites and automations that turn those searches into booked inspections. Worth two minutes?",
  },
  {
    niche: "Dentists", kind: "opening", title: "Dentists opening",
    body: "Hi {{contact_name}}, {{caller_name}} from ParaTech. We help dental practices fill their hygiene and new-patient schedule with a faster website, online booking and automatic reminders. Are you the right person to speak with about new-patient flow?",
  },
  { niche: null, kind: "objection", title: "We already have a website", body: "That's great — most of our clients did too. We're not suggesting you start over; we look at whether the site is actually bringing in calls. Can I send you a quick, free review of how it performs on mobile and in local search? If it's already strong, I'll tell you." },
  { niche: null, kind: "objection", title: "No budget", body: "Understood — I'm not asking you to commit to anything today. Our clients usually start with one small project that pays for itself. If I could show you what that looks like in a 15-minute call, would that be worth your time?" },
  { niche: null, kind: "objection", title: "Send me an email", body: "Happy to. So I send something relevant — what's the one thing you'd most want to improve about how customers find or contact {{business_name}}? And could we pencil in a 10-minute call later this week to go through it?" },
  { niche: null, kind: "objection", title: "Not the right time", body: "Completely fair. When would be a better time — next month, or after your busy season? I'll put a note in and reach back out then rather than chase you." },
];

const DEFAULT_TEMPLATES: { name: string; subject: string; body: string }[] = [
  {
    name: "As discussed – our portfolio",
    subject: "As discussed — ParaTech portfolio for {{business_name}}",
    body: "Hi {{contact_name}},\n\nThanks for taking my call. As promised, here's a look at some of our recent work: https://www.paratechsolutions.com/work\n\nIf anything stands out, reply here and I'll set up a short call to talk through what it could look like for {{business_name}}.\n\nBest,\n{{caller_name}}",
  },
  {
    name: "Meeting confirmation",
    subject: "Confirmed: our call about {{business_name}}",
    body: "Hi {{contact_name}},\n\nThis confirms our meeting. {{meeting_details}}\n\nIf anything changes just reply to this email and we'll find another time.\n\nBest,\n{{caller_name}}",
  },
  {
    name: "Sorry I missed you",
    subject: "Quick follow-up for {{business_name}}",
    body: "Hi {{contact_name}},\n\nI tried you earlier and didn't want to leave you guessing. We help {{niche}} businesses win more customers with better websites and automation. If that's useful, reply with a good time to talk and I'll call you then.\n\nBest,\n{{caller_name}}",
  },
];

/** Seed a freshly created organization with sensible defaults. */
export function seedOrgDefaults(orgId: number) {
  tx(() => {
    for (const o of DEFAULT_OUTCOMES) {
      insert(
        `INSERT OR IGNORE INTO outcomes (org_id, key, label, action, retry_days, is_conversation, color, sort, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        orgId, o.key, o.label, o.action, o.retry_days, o.is_conversation, o.color, o.sort,
      );
    }
    DEFAULT_STAGES.forEach((s, i) =>
      insert("INSERT INTO pipeline_stages (org_id, name, kind, sort) VALUES (?, ?, ?, ?)", orgId, s.name, s.kind, i + 1),
    );
    for (const [kind, labels] of Object.entries(DEFAULT_OPTIONS)) {
      labels.forEach((label, i) =>
        insert("INSERT OR IGNORE INTO options (org_id, kind, label, sort) VALUES (?, ?, ?, ?)", orgId, kind, label, i + 1),
      );
    }
    DEFAULT_SCRIPTS.forEach((s, i) =>
      insert("INSERT INTO scripts (org_id, niche, kind, title, body, sort) VALUES (?, ?, ?, ?, ?, ?)", orgId, s.niche, s.kind, s.title, s.body, i),
    );
    for (const t of DEFAULT_TEMPLATES) {
      insert("INSERT INTO email_templates (org_id, name, subject, body) VALUES (?, ?, ?, ?)", orgId, t.name, t.subject, t.body);
    }
  });
}

export function createOrganization(name: string): number {
  const id = insert("INSERT INTO organizations (name, created_at) VALUES (?, ?)", name, now());
  seedOrgDefaults(id);
  setSetting(id, "company_name", name);
  return id;
}
