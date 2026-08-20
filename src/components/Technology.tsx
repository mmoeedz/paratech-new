import { Reveal } from "./Reveal";
import { Section, SectionHeading } from "./ui/Section";

const GROUPS = [
  {
    title: "AI",
    items: [
      "Language models",
      "Retrieval over your own documents",
      "Agents and tool use",
      "Document and image processing",
    ],
  },
  {
    title: "Automation",
    items: [
      "Workflow orchestration",
      "APIs and webhooks",
      "CRM and calendar integrations",
      "Messaging channels",
    ],
  },
  {
    title: "Engineering",
    items: [
      "TypeScript and React",
      "Next.js",
      "Python and FastAPI",
      "Relational and vector databases",
    ],
  },
  {
    title: "Growth & data",
    items: [
      "Technical SEO tooling",
      "Google Ads and Analytics",
      "Attribution modelling",
      "Dashboards and reporting",
    ],
  },
];

export function Technology() {
  return (
    <Section tone="light">
      <SectionHeading
        tone="light"
        eyebrow="Technology"
        title="The tools behind the work."
        lead="We choose boring, well-supported technology on purpose — you should be able to hire someone else to maintain this."
      />

      <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {GROUPS.map((group, i) => (
          <Reveal key={group.title} delay={i * 0.05}>
            <div className="border-t border-line-light pt-5">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-copper-ink">
                {group.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm leading-relaxed text-ink-soft"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
