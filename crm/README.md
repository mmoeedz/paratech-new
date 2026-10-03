# ParaTech CRM

A cold-calling CRM for ParaTech's outbound team, built so it can grow into the multi-tenant SaaS described in
`ParaTech-CRM-Features.md`. This first version implements **all 16 modules of `crm-plan.md`**.

Callers dial in **Zoom Phone** (not from the CRM). The CRM keeps the leads, decides who to call next, logs every outcome,
schedules the follow-up automatically, tracks deals and meetings, and reports on performance.

```
My Queue shows the next lead  →  copy the number, dial in Zoom  →  pick an outcome + notes  →  CRM schedules the next step  →  Save & Next
```

## Run it

Requires Node 22.13+ (uses the built-in `node:sqlite`; the "experimental" warning in the logs is expected).

```bash
cd crm
npm install
cp .env.example .env.local     # optional: RESEND_API_KEY for email, CRM_DB_PATH
npm run dev                    # http://localhost:3200
```

Open the app: the first visit shows **/setup**, where you create the organization and the first admin. Then use
**Settings → Team** to add team leads and callers, set your company's postal address (needed for email), and
**Import leads**.

Want to look around first? `npm run seed:demo` (empty database only) creates demo users
(`admin@` / `lead@` / `ana@` / `ben@demo.test`, password `demo-password-1`) and a small call list.

Production: `npm run build && npm start` (port 3200). Back up the SQLite file (`CRM_DB_PATH`, default `./data/crm.db`).
SQLite is a single-node database — host this on a VM/container with a persistent disk, not on serverless (Vercel).

## Where each module lives

| # | Module | Screen / code |
|---|---|---|
| 1 | Login, users, roles | `/login`, `/setup`, **Settings → Team**, `lib/auth.ts` — Admin · Team lead · Caller |
| 2 | Leads | `/leads`, `/leads/[id]` — fields, status, timeline, copy number, Google this business, auto state/time zone |
| 3 | Lead import | `/import` — CSV/XLSX, column mapping, preview, duplicates by phone and name, DNC skip, invalid numbers flagged, batch tags |
| 4 | Call lists & assignment | `/lists` — progress per list, assign whole/part/even split, lead locking |
| 5 | Calling workspace | `/queue` — one lead at a time, live local time, callbacks → new → retries, hours filter, script, outcomes, Save & Next |
| 6 | Outcomes with automatic next steps | `lib/dispositions.ts` — editable in **Settings → Call outcomes** |
| 7 | Call log | `/calls` (filter by caller/date/outcome/list, CSV export) |
| 8 | Callbacks & tasks | `/callbacks` — lead-zone storage, your-zone display, in-app + browser reminders |
| 9 | Do-not-call & compliance | `/dnc`, calling-hours filter, attempt cap, phone type, National-registry matches |
| 10 | Deals pipeline | `/deals` drag-and-drop board (+ dropdown fallback), lost reason required |
| 11 | Meetings | `/meetings` — both time zones, Zoom link, Held / No-show / Reschedule |
| 12 | Scripts & objections | `/scripts` — shown beside the lead in the queue |
| 13 | Email templates | `/templates` + the lead page — one-to-one, logged on the timeline, CAN-SPAM footer |
| 14 | Dashboard & reports | `/dashboard`, `/reports` — caller day, leaderboard, funnel, niches/states, revenue |
| 15 | Settings | `/settings` — hours, attempts, retry gaps, niches, outcomes, stages, custom fields, CSV export |
| 16 | Zoom call-log sync | `/zoom` — upload a Zoom Phone call-log CSV: verifies calls really happened, attaches recordings |

## How the automatic next steps work

| Outcome | What the CRM does |
|---|---|
| No answer | Retry in 1 day (attempt cap: 6) |
| Left voicemail | Retry in 2 days |
| Gatekeeper | Asks for decision-maker + best time, retries next day at that time (lead's zone) |
| Wrong number | Marks the dialled number bad; closes the lead if none is left |
| Not interested | Closes the lead with a reason; optional re-contact in 90 days (it returns to the queue by itself) |
| Call back later | Asks for date/time (lead's zone, shown in yours), creates a callback |
| Interested | Opens a deal in the first pipeline stage |
| Meeting booked | Opens the meeting form, books it, puts the deal in "Meeting booked" |
| Do not call | Blocks every number on the lead permanently |

Retry gaps, outcome list and attempt cap are editable by admins.

## Compliance behaviour (built in, not optional)

- **Calling hours** — a lead is only shown in the queue between 8am and 9pm **in its own time zone** (an admin can narrow
  the window, never widen it). Callback times outside the window are rejected.
- **Unknown or ambiguous time zones** — leads with no zone are held back. States that straddle two zones (FL, TX, TN, KY,
  IN, MI, KS, NE, SD, ND, OR, ID) get a stricter window (1h margin each end, configurable) until the zone is set exactly.
- **Do-not-call** — permanent, org-wide, enforced at import, in the queue and when adding numbers. Records who and when.
- **No dialer, no AI voice** — calls are manual in Zoom. The CRM never auto-dials and has no AI-voice feature (the FCC treats AI
  voices as "artificial" under the TCPA).
- **Email** — one-to-one only; every message gets sender identity, postal address and an opt-out line, and is refused until
  the address is set. Contacts can be marked opted-out.
- Have a US telecom/TCPA lawyer review the setup before launch — penalties are per call. Turn on Zoom Phone's recording
  announcement if you record.

## Security notes

Passwords are scrypt-hashed; sessions are random tokens stored hashed (HttpOnly, SameSite=Lax cookies); login attempts are
throttled; every query is parameterised; every table is scoped by `org_id`; CSV exports neutralise spreadsheet formulas;
callers can only open their own leads/deals/meetings. 2FA is not built yet.

## Honest limits of this version

- **Email sending** needs a Resend key (`RESEND_API_KEY`, verified `CRM_FROM_EMAIL`). Without it, "send" saves a draft on the
  timeline and says so.
- **Zoom** is a CSV upload (Phone → Reports → Call Logs). A live Zoom API sync needs a Zoom Marketplace app created by a Zoom
  admin; the matching code (`lib/zoom.ts`) is what an API sync would feed.
- **National DNC Registry** — you scrub your list at the registry and paste the matches in; the CRM doesn't query it.
- Time zones come from the state / area code, not the business's exact address.
- One organization per install in the UI (the data model is already multi-tenant).

## Growing into the full SaaS (`ParaTech-CRM-Features.md`)

Every table already carries `org_id` and all access goes through `lib/*.ts`, so the planned path is: swap the SQLite layer for
Supabase Postgres + Row-Level Security, add org switching, 2FA, invites, billing (Stripe) and the Phase 2+ communication and
automation features. Cold-calling then becomes one template next to the mortgage template.

## Tests

```bash
npm test            # unit + workflow tests (in-memory SQLite): phone/zone/time logic, queue order & calling hours,
                    # every outcome, import, assignment/locking, Zoom matching, reports, tenant isolation
npm run test:e2e    # Playwright: first-run setup → import → assign → work the queue → deals → DNC → reports
                    # (set PW_CHROMIUM=/path/to/chromium to use an already-installed browser)
npm run lint && npm run typecheck
```
