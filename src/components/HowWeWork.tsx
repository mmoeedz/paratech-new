"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import { ChevronRight } from "./ui/Icons";

const STAGES = [
  {
    number: "01",
    name: "Understand",
    summary:
      "Deep audit of your business goals, users, workflows, and where the friction actually is.",
  },
  {
    number: "02",
    name: "Design",
    summary:
      "Insights turned into clear user journeys, interfaces, and a direction that's ready to build.",
  },
  {
    number: "03",
    name: "Engineer",
    summary:
      "Modern development, AI, automation, and integrations brought together into one system.",
  },
  {
    number: "04",
    name: "Launch",
    summary:
      "Tested flows, tuned performance, and a clean deployment across the environments that matter.",
  },
  {
    number: "05",
    name: "Improve",
    summary:
      "Real-world feedback and analytics driving what gets optimized, automated, or scaled next.",
  },
];

/* The rail spans circle-centre to circle-centre, so it insets by half a
   column at each end. */
const RAIL_INSET = `${50 / STAGES.length}%`;

export function HowWeWork() {
  const reduceMotion = useReducedMotion();

  return (
    // Background is solid, not a tint: the page body is dark, so a
    // translucent wash would show through and kill the light-surface text.
    <section
      id="process"
      className="relative scroll-mt-24 border-t border-line-light bg-[#faf7f2] py-24 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto text-center">
          <Reveal>
            <span className="inline-block rounded-full border border-copper/20 bg-copper/[0.06] px-3.5 py-1.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-ink">
              How we work
            </span>
          </Reveal>

          <Reveal delay={0.07}>
            {/* No text-balance: the line is meant to run full-width and drop
                only the trailing word, the way the reference sets it. The
                nowrap keeps "5-Step" from splitting at its hyphen, which is
                otherwise the first break point the line reaches. */}
            <h2 className="mt-5 font-display text-[clamp(2rem,4.2vw,3.25rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ink">
              From Problem to{" "}
              <span className="text-grad-copper text-[0.35em] leading-[1.6]">
                Possibility
              </span>{" "}
              — Our <span className="whitespace-nowrap">5-Step</span> Process
            </h2>
          </Reveal>
        </div>

        <div className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-2 lg:mt-16 lg:grid-cols-5 lg:gap-8">
          {/* Static groove, then the gradient that draws across it once the
              row scrolls into view. */}
          <span
            aria-hidden="true"
            className="absolute top-10 hidden h-[1.5px] bg-copper/20 lg:block"
            style={{ left: RAIL_INSET, right: RAIL_INSET }}
          />
          <motion.span
            aria-hidden="true"
            className="bg-grad-copper absolute top-10 hidden h-[1.5px] origin-left lg:block"
            style={{ left: RAIL_INSET, right: RAIL_INSET }}
            initial={reduceMotion ? undefined : { scaleX: 0 }}
            whileInView={reduceMotion ? undefined : { scaleX: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />

          {STAGES.map((stage, i) => (
            <Reveal key={stage.number} delay={i * 0.06} y={12}>
              <div className="group relative z-10 flex flex-row items-start gap-4 text-left md:flex-col md:items-center md:gap-0 md:text-center">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-copper bg-white shadow-[0_4px_20px_rgba(138,80,36,0.18)] transition-all duration-[350ms] ease-out group-hover:scale-[1.08] group-hover:shadow-[0_16px_35px_rgba(138,80,36,0.28)] md:mb-5 md:h-20 md:w-20">
                  <span className="text-grad-copper font-display text-lg font-bold md:text-xl">
                    {stage.number}
                  </span>
                </span>

                <div>
                  <p className="text-grad-copper text-xs font-bold uppercase tracking-[0.12em]">
                    {stage.name}
                  </p>
                  <p className="mt-2 max-w-[200px] text-sm leading-[1.6] text-ink-soft">
                    {stage.summary}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-20 flex flex-col items-center lg:mt-24">
            <p className="text-balance text-center font-display text-xl font-bold tracking-[-0.01em] text-ink sm:text-2xl">
              You bring the problem.{" "}
              <span className="text-ink-faint">
                We figure out what&apos;s worth building.
              </span>
            </p>
            <Link
              href="/contact"
              className="group bg-grad-copper mt-8 inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-[15px] font-bold text-ivory shadow-[0_10px_30px_-10px_rgba(138,80,36,0.6)] transition-shadow hover:shadow-[0_14px_36px_-10px_rgba(138,80,36,0.85)]"
            >
              Start a conversation
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
