/**
 * SQLite schema. Every business table carries `org_id` so the model is already
 * multi-tenant: moving to Postgres + Row-Level Security later is a data-layer
 * swap, not a redesign. All timestamps are ISO-8601 UTC strings.
 */
export const SCHEMA_VERSION = 1;

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','team_lead','caller')),
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  zoom_email TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts(email, at);

CREATE TABLE IF NOT EXISTS settings (
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (org_id, key)
);

-- Settings lists: niche | lost_reason | service | source | dead_reason
CREATE TABLE IF NOT EXISTS options (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  UNIQUE (org_id, kind, label)
);

CREATE TABLE IF NOT EXISTS outcomes (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  action TEXT NOT NULL,
  retry_days INTEGER,
  is_conversation INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'slate',
  sort INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (org_id, key)
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'open' CHECK (kind IN ('open','won','lost')),
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS custom_fields (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  entity TEXT NOT NULL CHECK (entity IN ('lead','deal')),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text','number','date','select','yesno')),
  options TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  UNIQUE (org_id, entity, key)
);

CREATE TABLE IF NOT EXISTS import_batches (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  source TEXT,
  filename TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  imported INTEGER NOT NULL DEFAULT 0,
  duplicates INTEGER NOT NULL DEFAULT 0,
  dnc_skipped INTEGER NOT NULL DEFAULT 0,
  invalid INTEGER NOT NULL DEFAULT 0,
  skipped TEXT
);

CREATE TABLE IF NOT EXISTS import_staging (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  headers TEXT NOT NULL,
  rows TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS call_lists (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  niche TEXT,
  state TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  timezone TEXT,
  tz_approx INTEGER NOT NULL DEFAULT 0,
  niche TEXT,
  source TEXT,
  google_rating REAL,
  google_reviews INTEGER,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','in_progress','interested','meeting_booked','client','dead','dnc')),
  assigned_to INTEGER REFERENCES users(id),
  list_id INTEGER REFERENCES call_lists(id),
  batch_id INTEGER REFERENCES import_batches(id),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_called_at TEXT,
  next_action_at TEXT,
  skip_until TEXT,
  locked_by INTEGER REFERENCES users(id),
  locked_at TEXT,
  decision_maker TEXT,
  best_time TEXT,
  dead_reason TEXT,
  recontact_at TEXT,
  email_optout INTEGER NOT NULL DEFAULT 0,
  custom TEXT NOT NULL DEFAULT '{}',
  name_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON leads(org_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(org_id, assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_leads_list ON leads(org_id, list_id);
CREATE INDEX IF NOT EXISTS idx_leads_name_key ON leads(org_id, name_key);

CREATE TABLE IF NOT EXISTS lead_phones (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  raw TEXT,
  label TEXT,
  phone_type TEXT NOT NULL DEFAULT 'unknown' CHECK (phone_type IN ('mobile','landline','voip','unknown')),
  is_primary INTEGER NOT NULL DEFAULT 0,
  bad INTEGER NOT NULL DEFAULT 0,
  bad_reason TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_phones_lead ON lead_phones(lead_id);
CREATE INDEX IF NOT EXISTS idx_phones_org_phone ON lead_phones(org_id, phone);

CREATE TABLE IF NOT EXISTS dnc (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  phone TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'internal' CHECK (scope IN ('internal','national')),
  reason TEXT,
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  marked_by INTEGER REFERENCES users(id),
  marked_at TEXT NOT NULL,
  UNIQUE (org_id, phone)
);

CREATE TABLE IF NOT EXISTS calls (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  phone TEXT,
  outcome_key TEXT NOT NULL,
  outcome_label TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT '',
  conversation INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  duration_sec INTEGER,
  attempt_no INTEGER NOT NULL DEFAULT 1,
  list_id INTEGER,
  called_at TEXT NOT NULL,
  zoom_call_id INTEGER,
  verified TEXT NOT NULL DEFAULT 'unchecked' CHECK (verified IN ('unchecked','matched','unmatched')),
  recording_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_calls_org_time ON calls(org_id, called_at);
CREATE INDEX IF NOT EXISTS idx_calls_lead ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_user ON calls(org_id, user_id, called_at);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('callback','task')),
  title TEXT NOT NULL,
  notes TEXT,
  due_at TEXT NOT NULL,
  lead_tz TEXT,
  done_at TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  reminded_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(org_id, user_id, done_at, due_at);

CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  service TEXT,
  value REAL NOT NULL DEFAULT 0,
  stage_id INTEGER NOT NULL REFERENCES pipeline_stages(id),
  owner_id INTEGER REFERENCES users(id),
  found_by INTEGER REFERENCES users(id),
  lost_reason TEXT,
  lost_notes TEXT,
  closed_at TEXT,
  custom TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deals_org_stage ON deals(org_id, stage_id);

CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  scheduled_at TEXT NOT NULL,
  lead_tz TEXT,
  zoom_link TEXT,
  attendees TEXT,
  owner_id INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending','held','no_show','rescheduled')),
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_meetings_org_time ON meetings(org_id, scheduled_at);

-- Lead / deal timeline.
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id, created_at);

CREATE TABLE IF NOT EXISTS scripts (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  niche TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('opening','objection')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS email_templates (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_log (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS zoom_calls (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  batch TEXT,
  caller_email TEXT,
  user_id INTEGER REFERENCES users(id),
  phone TEXT,
  started_at TEXT NOT NULL,
  duration_sec INTEGER,
  direction TEXT,
  recording_url TEXT,
  matched_call_id INTEGER,
  lead_id INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_zoom_org_time ON zoom_calls(org_id, started_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL
);
`;
