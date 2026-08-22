import { Reveal } from "./Reveal";
import { Section, SectionHeading } from "./ui/Section";
import { WorkflowDiagram } from "./WorkflowDiagram";
import { WORKFLOWS } from "@/data/workflows";

const NODES = [
  "Lead capture",
  "AI qualification",
  "CRM",
  "Personalised email",
  "Follow-up",
  "Sales team",
];

export function AutomationShowcase() {
  return (
    <Section tone="dark">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark" />

      <SectionHeading
        eyebrow="AI automation"
        title="Your business shouldn't run on repetitive tasks."
        lead="We connect your tools, your data, your team, and your customers so routine work completes itself — and a person only steps in when judgement is actually required."
      />

      <Reveal delay={0.12}>
        <div className="mt-14 rounded-xl border border-line bg-deep/60 p-6 sm:p-8 lg:p-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cloud-faint">
            Example — lead to sale
          </p>
          <div className="mt-8">
            <WorkflowDiagram nodes={NODES} />
          </div>
        </div>
      </Reveal>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WORKFLOWS.map((workflow, i) => (
          <Reveal key={workflow.title} delay={i * 0.05}>
            <div className="h-full rounded-xl border border-line bg-deep/40 p-6 transition-colors duration-300 hover:border-copper/40 hover:bg-deep">
              <span className="font-mono text-[10px] text-copper">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-base font-semibold text-cloud">
                {workflow.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-cloud-soft">
                {workflow.flow}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
