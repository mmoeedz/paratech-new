import { Fragment } from "react";
import { Reveal } from "./Reveal";
import { Eyebrow } from "./ui/Section";

/** `on` marks the steps the automation decides, rather than just relays. */
const NODES = [
  { label: "Enquiry", sub: "Form, call, or DM" },
  { label: "Qualify", sub: "Against your criteria", on: true },
  { label: "Book", sub: "Straight into the calendar" },
  { label: "CRM", sub: "Filed and enriched" },
  { label: "Follow up", sub: "Until it closes", on: true },
] as const;

export function FlowScene() {
  return (
    <section className="relative overflow-clip bg-obsidian py-24 sm:py-28 lg:py-32">
      <div aria-hidden="true" className="bg-blueprint absolute inset-0 opacity-60" />
      <div aria-hidden="true" className="bg-bloom-copper absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-6 text-center lg:px-8">
        <Reveal>
          <Eyebrow>One workflow, end to end</Eyebrow>
        </Reveal>

        <Reveal delay={0.07}>
          <h2 className="mx-auto mt-5 max-w-2xl text-balance font-display text-3xl font-semibold leading-[1.15] tracking-[-0.025em] text-cloud sm:text-4xl">
            Ninety seconds from enquiry to{" "}
            {/* box-decoration-clone keeps a wrapped phrase as one pill per
                line rather than a single stretched box. */}
            <mark className="box-decoration-clone -mx-[0.08em] rounded-[0.32em] bg-copper/20 px-[0.28em] py-[0.04em] text-copper-light">
              booked job
            </mark>
            .
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-cloud-soft">
            Every step is yours to change, every action is logged, and anything
            outside the rules goes to a person with the full history attached.
          </p>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="mt-12 rounded-[18px] border border-line bg-elevated p-3.5 text-left text-[11px] leading-[1.35] shadow-[0_30px_70px_rgba(0,0,0,0.5)] sm:p-5 sm:text-xs lg:mt-14">
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
              <span className="font-mono uppercase tracking-[0.12em] text-cloud-faint">
                Example — enquiry to booked job
              </span>
              <span className="flex-none whitespace-nowrap rounded-full bg-copper/20 px-2 py-0.5 text-[0.85em] font-semibold text-copper-light">
                Runs in 90 seconds
              </span>
            </div>

            {/* The steps stay readable content; only the connectors between
                them are decoration. */}
            <ol className="flex flex-col items-stretch md:flex-row">
              {NODES.map((node, i) => (
                <Fragment key={node.label}>
                  <li
                    className={`min-w-0 flex-1 rounded-[10px] border px-2 py-3 text-center ${
                      "on" in node
                        ? "border-copper-light/45 bg-copper/15"
                        : "border-line bg-cloud/[0.04]"
                    }`}
                  >
                    <div className="font-medium text-cloud">{node.label}</div>
                    <div className="mt-1 text-cloud-faint">{node.sub}</div>
                  </li>

                  {/* One connector per gap, drawn along whichever axis the
                      flow is currently running. */}
                  {i < NODES.length - 1 && (
                    <>
                      <li
                        aria-hidden="true"
                        className="flow-line-v my-2 h-[18px] self-center md:hidden"
                      />
                      <li
                        aria-hidden="true"
                        className="flow-line-h hidden w-[clamp(10px,2vw,28px)] flex-none self-center md:block"
                      />
                    </>
                  )}
                </Fragment>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
