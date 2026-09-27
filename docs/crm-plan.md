# Paratech Solutions — Cold-Calling CRM Plan

> Status: **Final plan (no code yet)**
> Scope: Internal CRM for the Paratech outbound team

---

## 1. Summary of decisions

| Topic | Decision |
|---|---|
| **How we get clients** | Outbound **cold calling** to **US businesses** |
| **Marketing our own company** | **No.** No ads, email campaigns, website attribution or inbound funnels |
| **Dialer** | **Zoom Phone (Zoom dialer).** All calls are made in Zoom, **not from the CRM** |
| **Role of the CRM** | Keep the leads, pick who to call next, log every call outcome, schedule callbacks, track deals and meetings, and report performance |
| **Zoom ↔ CRM connection** | None required to start. An optional Zoom call-log sync comes later (Module 16) |

---

## 2. How a call works (daily workflow)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│ 1. CRM shows │ →  │ 2. Caller    │ →  │ 3. Caller    │ →  │ 4. CRM schedules │
│ next lead in │    │ copies number│    │ picks outcome│    │ the next step    │
│ "My Queue"   │    │ & dials in   │    │ + writes     │    │ automatically    │
│              │    │ Zoom         │    │ notes in CRM │    │ → "Save & Next"  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────────┘
```

---

## 3. Modules

### Module 1: Login, users and roles
- Individual login for every caller.
- Roles:
  - **Admin:** full access, manages settings.
  - **Team lead:** sees the whole team, assigns lists, reviews performance.
  - **Caller:** sees only their own assigned leads.

### Module 2: Leads (prospects)
- **Fields:**
  - Business name, owner or contact name, phone(s), email, website
  - City, **state, time zone** (filled in automatically from the state or area code)
  - Niche/industry, lead source (Apollo, Google Maps, purchased list…)
  - Google rating and review count
  - Assigned caller
- **Status:** New · In progress · Interested · Meeting booked · Client · Dead · Do not call
- **Lead page:** a full timeline of calls, notes, callbacks and meetings in one place.
- **Buttons:** "Copy phone number" (for Zoom) and "Google this business".

### Module 3: Lead import
- Upload CSV or Excel, match the columns, and preview before saving.
- Finds duplicates by phone number and business name.
- Skips numbers that are on the do-not-call list.
- Flags invalid or badly formatted numbers.
- Tags each batch (e.g. "Roofers TX – Sept list").

### Module 4: Call lists and assignment
- Create lists by niche and state (e.g. "Dentists – Florida").
- Assign a whole list, or part of it, to callers.
- Progress for each list: total, called, remaining, interested, dead.
- **Lead locking:** a lead belongs to one caller at a time, so two callers never call the same business.

### Module 5: Calling workspace ("My Queue")
The screen callers use all day.
- Shows **one lead at a time**: name, number, **the lead's current local time**, previous notes, and how many times they've been called.
- **Queue order:** callbacks due now, then new leads, then retries.
- **Hides leads outside legal calling hours** (before 8am or after 9pm in *their* local time).
- The call script appears beside the lead.
- Outcome buttons, a notes box, then **"Save & Next"**.

### Module 6: Call outcomes (dispositions) with automatic next steps

| Outcome | What the CRM does automatically |
|---|---|
| No answer | Retry in 1 day (maximum 6 attempts) |
| Left voicemail | Retry in 2 days |
| Gatekeeper | Asks for the decision-maker's name and best time, then schedules a retry |
| Wrong number / disconnected | Marks the number bad |
| Not interested | Marks the lead dead and records the reason, with an optional re-contact in 90 days |
| Call back later | Asks for a date and time, then creates a callback |
| Interested | Moves the lead into the Deals pipeline |
| Meeting booked | Opens the meeting form |
| Do not call | Blocks the number permanently |

Admins can edit this outcome list, the retry gaps and the maximum attempts in Settings.

### Module 7: Call log (activity history)
- Every call attempt is saved: caller, date and time, outcome, notes, and optionally the call length.
- Admins can see all calls and filter them by caller, date, outcome and list.

### Module 8: Callbacks and tasks
- Callbacks are saved in the **lead's time zone** and shown in the **caller's time zone**.
- Views for today's callbacks and overdue callbacks, with reminder notifications.
- General tasks, e.g. "Send portfolio" or "Follow up after proposal".

### Module 9: Do-not-call and compliance
- **Internal do-not-call list:** blocked numbers can never be imported again or shown in the queue.
- **Calling-hours protection** based on the lead's time zone.
- **Attempt cap** for each lead.
- Optional fields: phone type (mobile or landline), and a check against the National DNC Registry.
- A record of who marked each number as do-not-call, and when.

### Module 10: Deals pipeline
- Drag-and-drop stages: **Interested → Meeting booked → Meeting done → Proposal sent → Negotiation → Won / Lost**
- Deal value and the service they want (Website, SEO, AI Automation, etc.).
- A required lost reason when a deal is lost.
- The closer or owner can be different from the caller who found the lead.

### Module 11: Meetings (booked appointments)
- Date and time shown in **both** time zones.
- The Zoom meeting link (pasted in) and who attends.
- Outcome: Held · No-show · Rescheduled
- Views for meetings today, meetings tomorrow, and no-shows to call back.

### Module 12: Scripts and objection handling
- An opening script for each niche, shown inside the calling workspace.
- Ready answers to common objections:
  - "We already have a website"
  - "No budget"
  - "Send me an email"
  - "Not the right time"

### Module 13: Email templates for after the call
- Templates such as "As discussed – here's our portfolio" and "Meeting confirmation".
- Sent from the lead page and logged automatically on the lead's timeline.
- One-to-one emails only, not bulk campaigns.

### Module 14: Dashboard and reports
- **Caller (daily):** calls made, conversations, interested, meetings booked, callbacks completed.
- **Team:** a leaderboard, and conversion at each step (calls → conversations → interested → meetings → won).
- **Lists and niches:** which niches and states convert best.
- **Revenue:** pipeline value, won deals, revenue per caller.
- Filters for date range, caller, list and niche.

### Module 15: Settings
- Niches, outcomes, pipeline stages, lost reasons.
- Calling hours, maximum attempts, retry gaps.
- Custom fields.
- Export data to CSV.

### Module 16: Zoom call-log sync (optional, later)
- Pull Zoom Phone call logs through the Zoom API and match them to leads by phone number.
- **Checks that callers really dialled:** compares the calls callers logged against Zoom's call records.
- Attaches call recordings to leads.
- Needs a Zoom Marketplace app created by a Zoom admin, with permission to read call logs and recordings.

---

## 4. Build phases

| Phase | Modules | Result |
|---|---|---|
| **Phase 1: MVP** | 1, 2, 3, 4, 5, 6, 7, 8, 9 (internal DNC + calling hours) | The team can import leads, work the queue, log calls and handle callbacks |
| **Phase 2: Selling** | 10, 11, 14 | Deals pipeline, meetings and performance dashboards |
| **Phase 3: Polish** | 12, 13, 15, full 9 | Scripts, email templates, full settings and compliance |
| **Phase 4: Later** | 16, AI call summaries, lead enrichment | Automation and checking that calls really happened |

With **Phase 1 alone**, the team can start calling.

---

## 5. US calling compliance notes

- **Calling hours:** 8am–9pm in the **called party's local time** (TCPA). Some states are stricter.
- **Do-not-call requests** must be honoured immediately and permanently (internal DNC list).
- **National DNC Registry:** B2B calls to business lines are largely exempt, but many small-business owners use personal cell phones. Checking the registry is cheap protection.
- **Manual dialing only.** Do **not** use autodialers, prerecorded messages or **AI voice agents** for cold calls to cell phones without prior consent. The FCC treats AI-generated voices as "artificial" under the TCPA.
- **Call recording:** about a dozen states (e.g. CA, FL, IL, PA, WA) require everyone on the call to agree. Turn on Zoom Phone's automatic recording announcement.
- **Follow-up emails** must include a physical address and an opt-out (CAN-SPAM).
- Have a US telecom/TCPA lawyer confirm the setup before launch. Penalties are charged per call.

---

## 6. Zoom Phone checklist

- [ ] A Zoom Phone license for each caller
- [ ] US phone numbers in the area codes you target most (local presence improves answer rates)
- [ ] Automatic call-recording announcement enabled (if recording)
- [ ] If callers are **outside the US**, confirm with Zoom that they can hold and call from US numbers
- [ ] (Later, Module 16) A Zoom Marketplace app with permission to read call logs and recordings

---

## 7. Open questions (needed before the Phase 1 technical spec)

1. **How many callers** will use the CRM, and are they in the US or abroad?
2. **Where do the lead lists come from?** (Apollo, Google Maps scraping, purchased lists?) This decides the import format.
3. **Which niches first?** (e.g. roofers, dentists, real estate agents) This decides scripts and list setup.

**Next step:** Once these are answered, write the Phase 1 technical spec (database tables, screens, fields).
