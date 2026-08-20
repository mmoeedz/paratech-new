import { Reveal } from "./Reveal";
import { Section, SectionHeading } from "./ui/Section";

const DISCIPLINES = [
  {
    title: "Design",
    description:
      "Interface and experience design that earns trust in the first few seconds.",
  },
  {
    title: "Engineering",
    description:
      "Web, software, and integration work built to be maintained, not just shipped.",
  },
  {
    title: "Growth",
    description:
      "Search, local, and paid acquisition measured against enquiries rather than traffic.",
  },
  {
    title: "Automation & AI",
    description:
      "Workflow automation and AI agents wired into the tools a business already runs on.",
  },
];

const PRINCIPLES = [
  {
    title: "We build against your real data",
    description:
      "Not a seeded demo. If it can't handle your actual leads, invoices, and edge cases, it isn't finished.",
  },
  {
    title: "We say what something will cost",
    description:
      "Scope, timeline, and price agreed before work starts. If scope changes, we tell you before the invoice does.",
  },
  {
    title: "We hand over what we build",
    description:
      "Documentation and training as standard. You should never be locked in by a system only we understand.",
  },
];

export function About() {
  return (
    <>
      <Section tone="light" isPageTop>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <SectionHeading
            as="h1"
            tone="light"
            eyebrow="About"
            title="A team built around the whole system, not one slice of it."
          />

          <div className="flex flex-col justify-center gap-6">
            <Reveal delay={0.08}>
              <p className="text-lg leading-relaxed text-ink-soft">
                Most businesses end up with a designer who doesn&apos;t talk to
                the developer, an agency running ads against a site nobody
                optimised, and a pile of manual work nobody owns. The result is
                a digital presence made of disconnected parts.
              </p>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="text-lg leading-relaxed text-ink-soft">
                Paratech exists to be the opposite of that. Designers,
                engineers, growth specialists, and automation people work as one
                unit on every engagement — so the strategy, the build, and the
                systems that run it stay connected from the first week.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line-light bg-line-light sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
          {DISCIPLINES.map((discipline, i) => (
            <Reveal key={discipline.title} delay={i * 0.05}>
              <div className="flex h-full flex-col bg-ivory p-6">
                <h2 className="text-base font-semibold text-ink">
                  {discipline.title}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-faint">
                  {discipline.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="dark">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
        <SectionHeading
          eyebrow="How we operate"
          title="Three commitments we hold to."
          lead="Not values on a wall — the specific things clients tell us are rare."
        />
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {PRINCIPLES.map((principle, i) => (
            <Reveal key={principle.title} delay={i * 0.06}>
              <div className="flex h-full flex-col rounded-xl border border-line bg-deep/60 p-7">
                <span className="font-mono text-xs text-copper">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-cloud">
                  {principle.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-cloud-soft">
                  {principle.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
