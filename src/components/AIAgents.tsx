import { Reveal } from "./Reveal";
import { Section, SectionHeading } from "./ui/Section";

const CAPABILITIES = [
  "Research and summarise information",
  "Read and analyse documents",
  "Process and validate data",
  "Qualify and route leads",
  "Respond to customers in context",
  "Generate reports on schedule",
  "Call your APIs and internal tools",
  "Trigger downstream workflows",
  "Escalate to a human with full context",
  "Log every action for review",
];

const ARCHITECTURE = [
  { label: "Request", detail: "A customer message, form, or scheduled trigger" },
  { label: "Agent", detail: "Interprets intent and decides what to do" },
  { label: "Knowledge", detail: "Your documents, policies, and history" },
  { label: "Tools & APIs", detail: "CRM, calendar, database, payment systems" },
  { label: "Action", detail: "Books, replies, updates, files, or notifies" },
  { label: "Oversight", detail: "Logged, reviewable, escalated when unsure" },
];

export function AIAgents() {
  return (
    <Section tone="dark" className="bg-deep!">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-60" />

      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="AI agents"
            title="Agents that do more than answer questions."
            lead="A chatbot replies. An agent completes the task — inside your systems, with your data, and with a clear record of what it did."
          />

          <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {CAPABILITIES.map((capability) => (
              <li
                key={capability}
                className="flex items-start gap-2.5 text-sm text-cloud-soft"
              >
                <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-copper" />
                {capability}
              </li>
            ))}
          </ul>
        </div>

        <Reveal delay={0.1}>
          <div className="rounded-xl border border-line bg-obsidian/70 p-7 lg:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cloud-faint">
              Agent architecture
            </p>
            <ol className="mt-7 flex flex-col">
              {ARCHITECTURE.map((step, i) => (
                <li key={step.label} className="flex flex-col">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] text-copper">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-cloud">
                        {step.label}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-cloud-faint">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                  {i < ARCHITECTURE.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="my-2.5 ml-[5px] h-5 w-px bg-line"
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
