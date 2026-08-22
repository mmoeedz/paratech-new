# Paratech Website Improvement Plan

**Purpose:** Turn the current Paratech website into a reliable, conversion-focused, production-ready agency website.

**Current status:** The website has a good visual and content foundation, but it must not be deployed yet. The current production build fails, and the enquiry form does not reliably deliver leads.

---

## 1. The target website flow

The website should help a visitor move from **interest** to **trust** to **enquiry** with as little friction as possible.

```text
Visitor arrives from Google, ads, referral, or social media
        |
        v
Relevant landing page (Home / Service / Case Study / Insight)
        |
        v
Clear problem + clear outcome + proof the team can deliver
        |
        v
Relevant next action
  - Book discovery call
  - Get automation assessment
  - Request website/growth audit
  - View related case study
        |
        v
Contact form with real server submission
        |
        +--> Visitor receives confirmation email
        +--> Paratech receives complete enquiry
        +--> Lead is stored in CRM / spreadsheet / inbox
        +--> Team receives notification and follows up
        |
        v
Discovery call -> proposal -> project
```

### What every important page should contain

1. **Who the page is for**
   - Example: “For service businesses losing leads because replies are too slow.”

2. **The problem being solved**
   - Explain the costly situation in plain language.

3. **The outcome**
   - Example: “Every new enquiry is answered, qualified, and sent to the right person within minutes.”

4. **How Paratech solves it**
   - A short process, deliverables, and timeline.

5. **Proof**
   - Case study, testimonial, result, example workflow, client logo, or demonstration.

6. **One relevant action**
   - Do not rely only on a generic “Start a project” button.

---

## 2. Fix these before launch

### 2.1 Fix the production build failure

**Problem**

`src/components/AutomationShowcase.tsx` imports `WORKFLOWS`, but `src/data/workflows.ts` exports `AUTOMATION_STEPS`. This makes `npm run build` fail, so the production site cannot be deployed.

**Required change**

Decide what the Automation Showcase should display:

- **Option A — workflow examples:** keep `WORKFLOWS` and define/export it in `src/data/workflows.ts` with `title` and `flow` fields.
- **Option B — automation process steps:** change `AutomationShowcase.tsx` to use `AUTOMATION_STEPS` and render each item’s `icon`, `title`, and `description`.

Use one consistent data model. Do not leave the component importing data that does not exist.

**Definition of done**

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three commands must pass with exit code `0`.

### 2.2 Add required quality checks

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "build": "next build",
    "test": "playwright test"
  }
}
```

Run `lint`, `typecheck`, and `build` before every deployment. In GitHub Actions, Vercel, or another CI system, block deployment when one fails.

### 2.3 Use one email address and one brand identity

**Current issue**

The website references both:

- `hello@paratech.agency`
- `contact@paratechsolutions.com`

The footer link is also invalid because it has no `mailto:` prefix.

**Required change**

Choose one public inbox. For example:

```ts
// src/lib/site.ts
email: "hello@paratech.agency"
```

Then use `SITE.email` in the contact page, footer, form recipient, structured data, CRM notifications, and automated confirmation emails.

Footer pattern:

```tsx
<a href={`mailto:${SITE.email}`}>{SITE.email}</a>
```

**Definition of done**

- Every email link opens the same correct inbox.
- The website, Google Business Profile, social accounts, and outbound emails use the same business identity.

---

## 3. Build a real enquiry flow

### 3.1 Why the current form needs replacing

The current form only creates a visitor-side `mailto:` link. This is not a dependable commercial lead flow because it requires an installed email app and gives no real delivery result.

The current flow is:

```text
Visitor fills form -> browser opens email app -> visitor must still press Send
```

The desired flow is:

```text
Visitor fills form
  -> client validation gives quick feedback
  -> secure server submission
  -> server validation
  -> spam/rate-limit checks
  -> enquiry saved in CRM/database
  -> team notification email/Slack message
  -> visitor confirmation email
  -> success state shown in the form
```

### 3.2 Recommended implementation

For this Next.js site, use a **Server Action** or secure route handler combined with one delivery provider:

- **Resend** for email delivery.
- **HubSpot** if sales follow-up and CRM pipeline are important.
- **Formspree** for the fastest managed solution.

Recommended default: **Next.js Server Action + Resend + a simple CRM/spreadsheet integration.**

### 3.3 Form fields

Keep the form short enough to complete quickly:

Required:

- Name
- Work email
- What they need help with
- Message

Optional:

- Company
- Phone
- Budget range
- Preferred contact method

Add a hidden honeypot field. If it is filled, silently reject the submission as spam.

### 3.4 Validation rules

Validate on both client and server:

| Field | Rule |
| --- | --- |
| Name | 2–100 characters |
| Email | Valid email address; trim spaces |
| Company | Optional; max 150 characters |
| Phone | Optional; normalize safely |
| Service | Must match a known service or “Not sure” |
| Budget | Must match an allowed range |
| Message | Minimum 20 characters; maximum sensible limit |

Never trust client-side validation alone.

### 3.5 Submission states

The form must visibly support these states:

```text
Idle -> Validating -> Sending -> Success
                         |
                         -> Error / retry
```

Success message example:

> Thanks — your enquiry has been received. We will reply within one business day.

Error message example:

> We could not send your enquiry. Please try again or email hello@paratech.agency directly.

### 3.6 Team follow-up flow

```text
New enquiry submitted
  -> Send formatted email to Paratech inbox
  -> Create CRM lead with source page and selected service
  -> Notify the team in Slack/email
  -> Send visitor acknowledgement
  -> Team replies within one business day
  -> If no reply in 24 hours, create a follow-up reminder
```

Capture the source URL and UTM parameters so the team knows whether the lead came from SEO, ads, social media, referral, or a specific service page.

---

## 4. Improve conversion and trust

### 4.1 Add proof above the fold or shortly after it

The homepage explains capabilities well, but agency buyers need proof before contacting a new provider.

Add a section such as:

```text
Trusted outcomes
  - “Reduced first-response time from 4 hours to 3 minutes”
  - “Replaced 12 hours/week of manual reporting”
  - “Increased qualified local enquiries by 38%”
```

Only use real, defensible results. If results are not available yet, use anonymized workflow examples and explain the context honestly.

### 4.2 Improve the Work page

Each case study should include:

1. Client industry and starting problem.
2. What was built or changed.
3. Delivery process and timeframe.
4. Measurable result.
5. Screenshots, workflow diagram, or before/after evidence.
6. A relevant CTA: “Need a similar system? Book a discovery call.”

Suggested case-study layout:

```text
Headline result
Client / industry / project period
Challenge
Approach
What was delivered
Results and metrics
Relevant visual proof
CTA
```

### 4.3 Use intent-based calls to action

Replace repeated generic calls to action with page-specific actions:

| Page | Better CTA |
| --- | --- |
| AI & Automation | Get an automation assessment |
| Web & Software | Plan your website or system |
| Growth & Marketing | Request a growth audit |
| Data & Analytics | Discuss your reporting workflow |
| Work | Discuss a similar project |
| Insights | Get practical updates |

Each CTA should lead to a contact form with the service preselected.

### 4.4 Clarify purchasing information

Add clear answers to common buyer questions:

- Who is the ideal client?
- What locations do you serve?
- What is the usual project timeline?
- Do you offer one-off work, retainers, or both?
- What budget range is typical?
- What happens during discovery?
- What does success look like?

Do not need to publish exact pricing if that does not suit the business. You can give sensible starting ranges or explain how scoping works.

---

## 5. Accessibility improvements

### 5.1 Mobile menu focus trap

The mobile navigation has useful accessibility work already: Escape closes it, background content is made inert, and initial focus is moved into the menu. Add a true focus trap because the menu is declared as a modal dialog.

Expected keyboard behavior:

```text
Open menu
  -> focus moves to first menu item
  -> Tab cycles through menu controls only
  -> Shift+Tab cycles backwards through menu controls only
  -> Escape closes menu
  -> focus returns to menu button
```

Use a tested dialog library or implement this carefully.

### 5.2 Accessibility test checklist

- Navigate every page using only a keyboard.
- Confirm visible focus on every link, button, input, and menu control.
- Test at 200% browser zoom.
- Test with Windows High Contrast mode.
- Check muted text against dark backgrounds for sufficient contrast.
- Test the form with a screen reader.
- Confirm reduced-motion preference removes non-essential animation.
- Make all decorative graphics `aria-hidden` and provide text alternatives for meaningful images.

---

## 6. Performance improvements

### 6.1 Keep JavaScript focused on interactions

The site uses several client components and Framer Motion animations. This creates a polished experience, but animation and scroll processing can hurt lower-end phones.

Improve this by:

- Keep content-only sections as Server Components.
- Use client components only where a visitor must interact.
- Load heavy animation code only when it is needed.
- Use `requestAnimationFrame` for custom scroll calculations.
- Do not update React state on every scroll event unless essential.
- Test with a throttled CPU and slow 4G connection.

### 6.2 Review the scroll-driven services section

The service scroller is a distinctive feature, but it needs real-device testing.

Verify that:

- It does not prevent normal scrolling.
- It works with keyboard navigation.
- Links are easy to reach on touch devices.
- It does not create motion sickness.
- It still communicates the service information when JavaScript is unavailable or reduced motion is enabled.

### 6.3 Measure before optimizing

Before and after launch, collect:

- Lighthouse mobile score.
- Largest Contentful Paint (LCP).
- Interaction to Next Paint (INP).
- Cumulative Layout Shift (CLS).
- JavaScript bundle size.
- Contact-form conversion rate.

Add analytics only after documenting consent and privacy requirements for the regions you serve.

---

## 7. SEO and content plan

### 7.1 Fix sitemap freshness

The sitemap currently uses the current date for every page each time it is generated. Do one of these instead:

- Use an actual content update date for each static page.
- Use a CMS-provided update date when content becomes dynamic.
- Omit `lastModified` until there is real source data.

### 7.2 Create individual Insights articles

The current Insights page is a useful list, but search engines and visitors benefit from standalone article pages.

Recommended structure:

```text
/insights
/insights/automate-the-workflow-not-the-job-title
/insights/speed-of-response-beats-quality-of-pitch
/insights/build-against-real-data-from-day-one
```

Each article should have:

- Unique title and description.
- Publication and updated date.
- Author name.
- Main topic/category.
- Estimated reading time.
- Related services and articles.
- Article structured data.
- Clear CTA at the end.

### 7.3 Add structured data only for real content

Keep the existing Organization/ProfessionalService schema, then consider:

- `Service` schema for each service category.
- `FAQPage` schema for visible FAQ sections.
- `Article` schema for insight articles.
- `CaseStudy`-style structured data only where it accurately reflects published work.

Never add schema for claims, ratings, locations, or reviews that are not visible and true.

### 7.4 Local SEO, if relevant

If Paratech serves a defined local market:

- Publish consistent name, address, phone number, and service area.
- Maintain a Google Business Profile.
- Create location/service pages only when they contain genuinely useful local content.
- Ask satisfied clients for legitimate Google reviews.

Do not create thin location pages for many cities; they tend to be low-value and can harm trust.

---

## 8. Add failure and loading states

Add these Next.js App Router files:

```text
src/app/loading.tsx
src/app/error.tsx
src/app/global-error.tsx
```

### Expected behavior

- `loading.tsx`: lightweight page skeleton or progress state when a route is loading.
- `error.tsx`: friendly message, a retry button, and a route back to the homepage/contact page.
- `global-error.tsx`: final fallback if the root layout fails.
- `not-found.tsx`: keep the current 404 but ensure it gives useful paths forward.

---

## 9. Testing plan

### 9.1 Minimum automated tests

Add Playwright end-to-end tests for:

- Homepage loads successfully.
- Every primary navigation link resolves.
- Every service slug returns a working page.
- Invalid service slug shows the custom 404 page.
- Desktop services menu opens and closes.
- Mobile menu opens, closes with Escape, and traps focus.
- Contact form displays field validation errors.
- Contact form shows success state after a mocked successful request.
- Contact form shows an actionable error after a failed request.

### 9.2 Manual pre-launch checks

- Chrome, Safari, Firefox, and Edge.
- iPhone Safari and Android Chrome.
- Phone widths from 320px upward.
- Desktop widths up to large monitors.
- Keyboard-only navigation.
- Slow 4G and CPU throttling.
- No-JavaScript fallback where reasonable.
- All email, CTA, and social links.
- Metadata preview using a social sharing debugger.

---

## 10. Recommended delivery order

### Week 1 — Make it safe to launch

1. Fix build failure.
2. Add typecheck script and deployment checks.
3. Choose one company email/domain.
4. Repair all email links.
5. Replace `mailto:` submission with a real enquiry backend.
6. Test contact form success and failure paths.

### Week 2 — Make it trustworthy and accessible

1. Add case studies/testimonials/proof points.
2. Improve service-specific calls to action.
3. Add mobile-menu focus trap.
4. Add error, global-error, and loading states.
5. Run keyboard and screen-reader checks.

### Week 3 — Make it discoverable and fast

1. Fix sitemap dates.
2. Create individual Insights article routes.
3. Add accurate structured data.
4. Run Lighthouse/mobile performance tests.
5. Reduce unnecessary client JavaScript and scroll work.
6. Set up Search Console and analytics with appropriate privacy controls.

---

## 11. Launch checklist

### Technical

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Production environment variables are configured.
- [ ] No secrets are included in client-side code.
- [ ] Contact form delivers leads successfully.
- [ ] Contact form handles errors safely.
- [ ] All routes, links, and redirects work.

### Content and conversion

- [ ] One clear business email is used everywhere.
- [ ] All CTAs have a useful, working destination.
- [ ] Service pages have relevant proof and next steps.
- [ ] Work page contains real evidence, not only descriptions.
- [ ] Contact-page response-time promise is realistic.

### SEO and accessibility

- [ ] Each route has a unique title, description, and canonical URL.
- [ ] Sitemap and robots files are correct for the live domain.
- [ ] Open Graph image is correct.
- [ ] Structured data matches visible content.
- [ ] Keyboard navigation works across the site.
- [ ] Mobile menu has a focus trap.
- [ ] Contrast and mobile layouts are tested.
- [ ] Reduced-motion behavior is tested.

---

## Final priority statement

The most important work is not visual redesign. First make the site **build reliably**, **capture enquiries reliably**, and **present a consistent, trustworthy identity**. Once those are complete, invest in proof-rich case studies, stronger service-specific CTAs, accessibility, SEO content, and performance measurement.
