import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeading } from "@/components/ui/Section";
import { ArrowRight } from "@/components/ui/Icons";
import { CTA } from "@/components/CTA";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

const TITLE = "Insights | ParaTech";
const DESCRIPTION =
  "Practical notes on AI automation, web performance, local search, and building digital systems that hold up in production.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/insights" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/insights" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const NOTES = [
  {
    slug: "automate-the-workflow-not-the-job-title",
    topic: "AI Automation",
    title: "Automate the workflow, not the job title",
    summary:
      "The automations that pay for themselves fastest are rarely the impressive ones. They're the small, repetitive, high-frequency handoffs — the enquiry that sits unanswered for four hours, the invoice re-typed into two systems, the reminder nobody sent. Start by counting how often something happens, not how clever it would be to automate.",
    takeaway:
      "Rank candidate automations by frequency × delay cost, not by novelty.",
  },
  {
    slug: "speed-of-response-beats-quality-of-pitch",
    topic: "Growth",
    title: "Speed of response beats quality of pitch",
    summary:
      "For most local and B2B service businesses, the vendor who replies first wins a disproportionate share of the work — often before anyone compares proposals. That makes response time a growth lever, not an operations detail, and it's one of the few levers you can fix in a week rather than a quarter.",
    takeaway:
      "Measure your median first-response time before spending more on ads.",
  },
  {
    slug: "build-against-real-data-from-day-one",
    topic: "Web & Software",
    title: "Build against real data from day one",
    summary:
      "Software that works beautifully on seeded demo data has a habit of falling apart on contact with a real customer list — the duplicate records, the missing fields, the names that break your layout. Building against production-shaped data from the first week surfaces those problems while they're still cheap to fix.",
    takeaway:
      "If it hasn't run against your actual data, it hasn't been tested.",
  },
  {
    slug: "a-dashboard-nobody-opens-is-a-cost-not-an-asset",
    topic: "Data & Analytics",
    title: "A dashboard nobody opens is a cost, not an asset",
    summary:
      "Reporting only creates value when someone changes a decision because of it. That means fewer metrics, tied to specific decisions, owned by named people, delivered when the decision is actually made — not forty charts nobody has context for.",
    takeaway:
      "For every metric, name the decision it changes and the person who owns it.",
  },
];

export default function InsightsPage() {
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "ParaTech Insights",
    url: `${SITE.url}/insights`,
    blogPost: NOTES.map((note) => ({
      "@type": "BlogPosting",
      headline: note.title,
      description: note.summary,
      url: `${SITE.url}/insights#${note.slug}`,
      about: note.topic,
    })),
  };

  return (
    <>
      <JsonLd data={blogSchema} />

      <Section tone="light" isPageTop>
        <SectionHeading
          as="h1"
          tone="light"
          eyebrow="Insights"
          title="Notes from inside the work."
          lead="Short, practical observations from real engagements. No trend pieces, no predictions about the future of AI."
        />

        <div className="mt-16 flex flex-col divide-y divide-line-light border-t border-line-light sm:mt-20">
          {NOTES.map((note, i) => (
            <Reveal key={note.title} delay={i * 0.05}>
              <article
                id={note.slug}
                className="grid grid-cols-1 gap-6 scroll-mt-24 py-10 lg:grid-cols-[200px_1fr] lg:gap-12 lg:py-12"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-copper-ink">
                  {note.topic}
                </p>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">
                    {note.title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
                    {note.summary}
                  </p>
                  <p className="mt-5 border-l-2 border-copper-ink pl-4 text-sm font-medium text-ink">
                    {note.takeaway}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-14 rounded-xl border border-line-light bg-bone/40 p-7 sm:p-8">
            <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">
              Want these as they&apos;re written?
            </h2>
            <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-ink-soft">
              We publish occasionally, and only when there&apos;s something
              genuinely useful to say. Email us and we&apos;ll add you.
            </p>
            <Link
              href="/contact"
              className="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-copper-ink transition-colors hover:text-ink"
            >
              Get in touch
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </Section>

      <CTA />
    </>
  );
}
