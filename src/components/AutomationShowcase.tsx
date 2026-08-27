"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import { ChevronRight } from "./ui/Icons";

const NODES = [
  "Lead capture",
  "AI qualification",
  "CRM",
  "Personalised email",
  "Follow-up",
  "Sales team",
];

/* The rail spans circle-centre to circle-centre, so it insets by half a
   column at each end — same approach as HowWeWork's process rail. */
const RAIL_INSET = `${50 / NODES.length}%`;

export function AutomationShowcase() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative border-t border-line-light bg-[#faf7f2] py-24 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto text-center">
          <Reveal>
            <span className="inline-block rounded-full border border-copper/20 bg-copper/[0.06] px-3.5 py-1.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-ink">
              AI automation
            </span>
          </Reveal>

          <Reveal delay={0.07}>
            <h2 className="mt-5 text-balance font-display text-[clamp(2rem,4.2vw,3.25rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ink">
              Your business shouldn&apos;t run on{" "}
              <span className="text-grad-copper">repetitive tasks</span>.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-balance text-lg leading-relaxed text-ink-soft">
              We connect your tools, your data, your team, and your customers
              so routine work completes itself — and a person only steps in
              when judgement is actually required.
            </p>
          </Reveal>
        </div>

        <div className="relative mt-14 grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-12 lg:mt-16 lg:grid-cols-6 lg:gap-8">
          {/* Static groove, then the gradient that draws across it once the
              row scrolls into view. */}
          <span
            aria-hidden="true"
            className="absolute top-8 hidden h-[1.5px] bg-ink/15 lg:block md:top-10"
            style={{ left: RAIL_INSET, right: RAIL_INSET }}
          />
          <motion.span
            aria-hidden="true"
            className="bg-grad-copper absolute top-8 hidden h-[1.5px] origin-left lg:block md:top-10"
            style={{ left: RAIL_INSET, right: RAIL_INSET }}
            initial={reduceMotion ? undefined : { scaleX: 0 }}
            whileInView={reduceMotion ? undefined : { scaleX: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />

          {NODES.map((node, i) => (
            <Reveal key={node} delay={i * 0.06} y={12}>
              <div className="group relative z-10 flex flex-row items-start gap-4 text-left md:flex-col md:items-center md:gap-0 md:text-center">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-copper bg-white shadow-[0_4px_20px_rgba(138,80,36,0.18)] transition-all duration-[350ms] ease-out group-hover:scale-[1.08] group-hover:shadow-[0_16px_35px_rgba(138,80,36,0.28)] md:mb-5 md:h-20 md:w-20">
                  <span className="text-grad-copper font-display text-lg font-bold md:text-xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>

                <p className="text-grad-copper text-xs font-bold uppercase tracking-[0.12em]">
                  {node}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-20 flex flex-col items-center lg:mt-24">
            <p className="text-balance text-center font-display text-xl font-bold tracking-[-0.01em] text-ink sm:text-2xl">
              Work that moves forward{" "}
              <span className="text-ink-faint">
                without someone pushing it.
              </span>
            </p>
            <Link
              href="/contact"
              className="group bg-grad-copper mt-8 inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-[15px] font-bold text-ivory shadow-[0_10px_30px_-10px_rgba(138,80,36,0.6)] transition-shadow hover:shadow-[0_14px_36px_-10px_rgba(138,80,36,0.85)]"
            >
              Get an automation assessment
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
