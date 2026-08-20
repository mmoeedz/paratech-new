import { Reveal } from "./Reveal";
import { Section, SectionHeading } from "./ui/Section";

const CASES = [
  {
    number: "01",
    capability: "AI & Automation",
    sector: "Home & field services",
    client: "Multi-crew home services operator",
    metric: { value: "4 hrs → 2 min", label: "First response time" },
    built:
      "A lead engine that answers, qualifies, books the survey, and files it in the CRM.",
    result:
      "Nothing waits overnight, and the fastest quote is now ours.",
    stack: ["Web forms", "CRM", "AI qualification", "SMS"],
  },
  {
    number: "02",
    capability: "Web & Software",
    sector: "Hospitality",
    client: "Multi-branch restaurant group",
    metric: { value: "~100%", label: "Kitchen order accuracy" },
    built:
      "A custom point-of-sale and floor system built around the real kitchen workflow.",
    result:
      "Every branch visible live to head office, instead of at the weekly close.",
    stack: ["Next.js", "Custom backend", "Live dashboards"],
  },
  {
    number: "03",
    capability: "Growth & Marketing",
    sector: "Multi-location retail",
    client: "Regional retail chain",
    metric: { value: "Every location", label: "In the local map pack" },
    built:
      "Local SEO and Business Profile work per location, plus automated review requests.",
    result:
      "Consistent local map pack presence, with a steady flow of new reviews.",
    stack: ["Local SEO", "Google Business Profile", "Review automation"],
  },
  {
    number: "04",
    capability: "Data & Analytics",
    sector: "Logistics",
    client: "Freight and logistics operator",
    metric: { value: "4 → 1", label: "Systems in one live view" },
    built:
      "A reporting layer with live dashboards, self-assembling reports, and anomaly flags.",
    result:
      "A morning of manual reporting gone, and issues flagged before the P&L.",
    stack: ["Data pipeline", "Dashboards", "Automated reporting"],
  },
];

function Beat({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cloud-faint">
        {label}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-cloud-soft">
        {children}
      </p>
    </div>
  );
}

function CaseCard({ item }: { item: (typeof CASES)[number] }) {
  return (
    <div className="flex h-full flex-col border border-line bg-deep/60 p-5 lg:h-[540px]">
      <span className="font-mono text-[10px] text-copper">{item.number}</span>

      <h2 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.01em] text-cloud">
        {item.client}
      </h2>
      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cloud-faint">
        {item.capability} · {item.sector}
      </p>

      {/* The number this engagement is remembered for */}
      <div className="mt-5 border-y border-line py-4">
        <p className="text-lg font-semibold leading-tight tracking-[-0.02em] text-copper">
          {item.metric.value}
        </p>
        <p className="mt-1.5 text-[11px] leading-snug text-cloud-faint">
          {item.metric.label}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <Beat label="What we built">{item.built}</Beat>
        <Beat label="Result">{item.result}</Beat>
      </div>

      <ul className="mt-auto flex flex-col gap-1.5 pt-5">
        {item.stack.map((tag) => (
          <li
            key={tag}
            className="flex items-center gap-2 text-[11px] text-cloud-faint"
          >
            <span
              aria-hidden="true"
              className="h-[4px] w-[4px] shrink-0 bg-copper"
            />
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CaseStudies() {
  return (
    <Section tone="dark" isPageTop>
      <div className="pointer-events-none absolute inset-0 bg-grid-dark" />

      <SectionHeading
        as="h1"
        eyebrow="Selected work"
        title="Built for outcomes the business can feel."
        lead="A sample of engagements across all four capabilities. Client names are withheld where the work touches internal systems."
      />

      {/* Horizontal flow from desktop up — four cards plus connectors need
          roughly the full 6xl width, so it can't switch on any earlier. */}
      <ol className="mt-16 hidden items-center sm:mt-20 lg:flex">
        {CASES.map((item, i) => (
          <li
            key={item.client}
            className="flex flex-1 items-center last:flex-none"
          >
            <Reveal delay={i * 0.07} y={10} className="w-[244px] shrink-0">
              <CaseCard item={item} />
            </Reveal>
            {i < CASES.length - 1 && (
              <span aria-hidden="true" className="flow-line-h mx-3 flex-1" />
            )}
          </li>
        ))}
      </ol>

      {/* Vertical flow below desktop */}
      <ol className="mt-14 flex flex-col items-center sm:mt-16 lg:hidden">
        {CASES.map((item, i) => (
          <li key={item.client} className="flex w-full flex-col items-center">
            <Reveal delay={i * 0.05} y={10} className="w-full max-w-md">
              <CaseCard item={item} />
            </Reveal>
            {i < CASES.length - 1 && (
              <span aria-hidden="true" className="flow-line-v my-3 h-8" />
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}
