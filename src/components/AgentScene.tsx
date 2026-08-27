import { Reveal } from "./Reveal";
import { Eyebrow } from "./ui/Section";
import { CheckIcon } from "./ui/Icons";

const CAPABILITIES = [
  "Reads and analyses your documents and history",
  "Calls your APIs and internal tools to actually finish the job",
  "Escalates to a human with full context when unsure",
  "Logs every action for review",
];

/** Booked value per week, as a percentage of the best week. */
const WEEKS = [44, 38, 55, 49, 62, 58, 74, 69, 86];
/** First week the agent was running — the thing the chart is actually about. */
const AUTOMATED_FROM = 7;

const CHANNELS = [
  { name: "Search", share: 72 },
  { name: "Maps", share: 58 },
  { name: "Paid", share: 64 },
];

export function AgentScene() {
  return (
    // Background is solid, not a tint: the page body is dark, so a translucent
    // wash would show through and kill the light-surface text.
    <section className="relative overflow-clip border-t border-line-light bg-[#faf7f2] py-24 sm:py-28 lg:py-32">
      <div aria-hidden="true" className="bg-bloom-copper-light absolute inset-0" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)] lg:gap-16 lg:px-8">
        <div>
          <Reveal>
            <Eyebrow tone="light">Agents, not chatbots</Eyebrow>
          </Reveal>

          <Reveal delay={0.07}>
            <h2 className="mt-5 text-balance font-display text-3xl font-semibold leading-[1.25] tracking-[-0.025em] text-ink sm:text-4xl">
              A chatbot replies. An agent{" "}
              {/* box-decoration-clone keeps a wrapped phrase as one pill per
                  line rather than a single stretched box. */}
              <mark className="box-decoration-clone -mx-[0.08em] rounded-[0.32em] bg-copper/15 px-[0.28em] py-[0.04em] text-copper-ink">
                completes the task
              </mark>
              .
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-ink-soft">
              Inside your systems, with your data, and with a clear record of
              what it did — connected to the CRM, the calendar, and the tools
              your team already opens every morning.
            </p>
          </Reveal>

          <Reveal delay={0.14}>
            <ul className="mt-8 flex flex-col gap-3">
              {CAPABILITIES.map((capability) => (
                <li
                  key={capability}
                  className="grid grid-cols-[1.05rem_1fr] items-start gap-3 text-[0.9375rem] text-ink-soft"
                >
                  <CheckIcon className="mt-1 h-[1.05rem] w-[1.05rem] text-copper-ink" />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* The panel keeps the dark palette on this light ground: it is a
            product surface, not a page surface, and the contrast is what makes
            it read as a screen rather than a printed block.

            Decorative throughout — every value in it restates the copy beside
            it, so nothing here is content a reader would miss. */}
        <Reveal delay={0.18}>
          <div
            aria-hidden="true"
            className="overflow-clip rounded-3xl border border-line bg-elevated shadow-[0_30px_70px_rgba(23,32,63,0.28)]"
          >
            {/* Browser chrome, built in CSS: it scales with the layout, costs
                zero bytes, and re-themes with the tokens. */}
            <div className="relative flex h-[38px] items-center border-b border-line bg-cloud/[0.06] px-4">
              <div className="flex gap-2">
                <span className="h-[9px] w-[9px] rounded-full bg-cloud/30" />
                <span className="h-[9px] w-[9px] rounded-full bg-cloud/20" />
                <span className="h-[9px] w-[9px] rounded-full bg-cloud/10" />
              </div>
              {/* The address bar carries a breadcrumb of where the sample came
                  from — it reads as a product rather than a picture. */}
              <span className="absolute left-1/2 max-w-[62%] -translate-x-1/2 truncate rounded-full border border-line bg-cloud/[0.05] px-3 py-1 text-[11px] text-cloud-faint">
                Analytics › Weekly › Automated
              </span>
            </div>

            <div className="flex flex-col gap-4 p-4 text-[11px] leading-[1.35] sm:p-5 sm:text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono uppercase tracking-[0.12em] text-cloud-faint">
                  Weekly performance
                </span>
                <span className="flex-none whitespace-nowrap rounded-full bg-copper/20 px-2 py-0.5 text-[0.85em] font-semibold text-copper-light">
                  Sent 07:00
                </span>
              </div>

              <div className="flex gap-2.5">
                <div className="min-w-0 flex-1 rounded-xl border border-line bg-cloud/[0.04] px-3.5 py-3">
                  <span className="font-mono uppercase tracking-[0.12em] text-cloud-faint">
                    Revenue
                  </span>
                  <div className="mt-1 font-display text-[1.6em] font-semibold tabular-nums tracking-[-0.02em] text-copper-light">
                    +18%
                  </div>
                  <div className="mt-0.5 text-cloud-faint">vs. previous 6 weeks</div>
                </div>
                <div className="min-w-0 flex-1 rounded-xl border border-line bg-cloud/[0.04] px-3.5 py-3">
                  <span className="font-mono uppercase tracking-[0.12em] text-cloud-faint">
                    Cost / lead
                  </span>
                  <div className="mt-1 font-display text-[1.6em] font-semibold tabular-nums tracking-[-0.02em] text-cloud">
                    -31%
                  </div>
                  <div className="mt-0.5 text-cloud-faint">vs. previous 6 weeks</div>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-cloud/[0.04] px-3.5 py-3">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="text-cloud-faint">Booked value, last 9 weeks</span>
                  <span className="flex flex-none items-center gap-1.5 text-copper-light">
                    <span className="h-1.5 w-1.5 rounded-[2px] bg-copper" />
                    Agent running
                  </span>
                </div>

                {/* Each bar owns a full-height column, so its inline height is a
                    percentage of the plot area and the dashed marker can span
                    the column rather than just the bar. */}
                <div className="flex h-[clamp(64px,12vw,108px)] items-stretch gap-1">
                  {WEEKS.map((value, i) => (
                    <div
                      key={i}
                      className="relative flex min-w-0 flex-1 flex-col justify-end"
                    >
                      {i === AUTOMATED_FROM && (
                        <span className="absolute inset-y-0 -left-1 border-l border-dashed border-copper-light/50" />
                      )}
                      <span
                        style={{ height: `${value}%` }}
                        className={`rounded-t-[3px] ${
                          i >= AUTOMATED_FROM ? "bg-copper" : "bg-cloud/20"
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-1.5 flex gap-1">
                  {WEEKS.map((_, i) => (
                    <span
                      key={i}
                      className={`min-w-0 flex-1 text-center font-mono text-[0.85em] tabular-nums ${
                        i >= AUTOMATED_FROM
                          ? "text-copper-light"
                          : "text-cloud-faint"
                      }`}
                    >
                      {i + 1}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {CHANNELS.map((channel) => (
                  <div key={channel.name} className="flex items-center gap-3">
                    <span className="w-12 flex-none text-cloud-faint">
                      {channel.name}
                    </span>
                    <span className="relative h-1.5 flex-1 overflow-clip rounded-full bg-cloud/[0.10]">
                      <span
                        style={{ width: `${channel.share}%` }}
                        className="absolute inset-y-0 left-0 rounded-full bg-copper/70"
                      />
                    </span>
                    <span className="w-8 flex-none text-right font-medium tabular-nums text-cloud">
                      {channel.share}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-line pt-3 text-cloud-faint">
                <span>Compiled and sent by the agent</span>
                <span className="font-mono tabular-nums">12 actions logged</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
