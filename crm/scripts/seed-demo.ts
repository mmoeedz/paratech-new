/**
 * Demo data for trying the CRM: a few users, a call list of fake US businesses
 * spread across time zones, some calls, deals and a meeting.
 *
 *   npm run seed:demo
 *
 * Demo logins use a throwaway password and are for local use only — never run this
 * against a real database.
 */
import { get } from "../src/lib/db";
import { createOrganization } from "../src/lib/settings";
import { createUser } from "../src/lib/auth";
import { createLead } from "../src/lib/leads";
import { createList, assignList } from "../src/lib/lists";
import { logCall } from "../src/lib/dispositions";
import { getSettings } from "../src/lib/settings";
import type { User } from "../src/lib/auth";

if (get("SELECT 1 FROM users LIMIT 1")) {
  console.error("This database already has users — refusing to seed demo data over it.");
  process.exit(1);
}

const PASSWORD = "demo-password-1";
const org = createOrganization("ParaTech (demo)");
const mk = (name: string, email: string, role: "admin" | "team_lead" | "caller", tz: string) => createUser({ orgId: org, email, name, password: PASSWORD, role, timezone: tz });
const adminId = mk("Demo Admin", "admin@demo.test", "admin", "America/New_York");
const leadId = mk("Taylor Lead", "lead@demo.test", "team_lead", "America/New_York");
const ana = mk("Ana Caller", "ana@demo.test", "caller", "Asia/Karachi");
const ben = mk("Ben Caller", "ben@demo.test", "caller", "Asia/Karachi");

const userRow = (id: number) => get<User>("SELECT id, org_id, email, name, role, timezone, zoom_email, active FROM users WHERE id = ?", id)!;

const businesses: [string, string, string, string, string, number, number][] = [
  ["Lone Star Roofing", "Roofers", "Austin", "TX", "(512) 555-0142", 4.7, 132],
  ["Peak Roofing Co", "Roofers", "Denver", "CO", "(303) 555-0187", 4.5, 88],
  ["Bayview Roofing", "Roofers", "San Jose", "CA", "(408) 555-0120", 4.2, 41],
  ["Hudson Valley Roofing", "Roofers", "Albany", "NY", "(518) 555-0166", 4.8, 207],
  ["Aloha Roof Pros", "Roofers", "Honolulu", "HI", "(808) 555-0133", 4.6, 59],
  ["Gulf Coast Roofing", "Roofers", "Tampa", "FL", "(813) 555-0171", 4.1, 33],
  ["Windy City Roofers", "Roofers", "Chicago", "IL", "(312) 555-0105", 4.4, 76],
  ["Bright Smile Dental", "Dentists", "Miami", "FL", "(305) 555-0119", 4.9, 310],
  ["Sunrise Family Dentistry", "Dentists", "Orlando", "FL", "(407) 555-0150", 4.3, 54],
  ["Palm Dental Group", "Dentists", "Tallahassee", "FL", "(850) 555-0188", 4.6, 98],
];

const list = createList(org, leadId, { name: "Roofers & Dentists – demo", niche: "Roofers" });
for (const [name, niche, city, state, phone, rating, reviews] of businesses) {
  const r = createLead(org, { business_name: name, niche, city, state, phones: [phone], google_rating: rating, google_reviews: reviews, source: "Google Maps", list_id: list, contact_name: null }, leadId);
  if (!r.ok) throw new Error(`${name}: ${r.error}`);
}
assignList(org, leadId, { listId: list, callerIds: [ana, ben], mode: "unassigned", count: null, lockMinutes: getSettings(org).lock_minutes });

// A few calls so the dashboard and reports have something to show.
const anaUser = userRow(ana);
const first = get<{ id: number }>("SELECT id FROM leads WHERE assigned_to = ? ORDER BY id LIMIT 1", ana)!;
logCall(anaUser, { leadId: first.id, outcomeKey: "no_answer" });
const second = get<{ id: number }>("SELECT id FROM leads WHERE assigned_to = ? AND attempts = 0 ORDER BY id LIMIT 1", ana)!;
logCall(anaUser, { leadId: second.id, outcomeKey: "interested", notes: "Wants a new site before storm season.", dealService: "Website", dealValue: 4500 });

console.log("Demo data created. Sign in at the app with any of these (password: %s):", PASSWORD);
console.log("  admin@demo.test (Admin) · lead@demo.test (Team lead) · ana@demo.test, ben@demo.test (Callers)");
void adminId;
