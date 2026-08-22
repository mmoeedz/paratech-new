"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import { AUTOMATION_STEPS } from "@/data/workflows";

/* The rail spans circle-centre to circle-centre, so it insets by half a
   column at each end — same approach as HowWeWork's process rail. */
const RAIL_INSET = `${50 / AUTOMATION_STEPS.length}%`;

export function HowWeAutomate() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative border-t border-line-light bg-[#faf7f2] py-24 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto text-center">
          <Reveal>
            <span className="inline-block rounded-full border border-copper/20 bg-copper/[0.06] px-3.5 py-1.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-ink">
              How we automate
            </span>
          </Reveal>

          <Reveal delay={0.07}>
            <h2 className="mt-5 text-balance font-display text-[clamp(2rem,4.2vw,3.25rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ink">
              From manual work to{" "}
              <span className="text-grad-copper">automated results</span>.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-balance text-lg leading-relaxed text-ink-soft">
              We streamline your processes with smart automation so you can
              focus on what matters most.
            </p>
          </Reveal>
        </div>

        <div className="relative mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:mt-16 lg:grid-cols-6 lg:gap-8">
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

          {AUTOMATION_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={i * 0.06} y={12}>
                <div className="group relative z-10 flex flex-row items-start gap-4 text-left md:flex-col md:items-center md:gap-0 md:text-center">
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-copper bg-white shadow-[0_4px_20px_rgba(138,80,36,0.18)] transition-all duration-[350ms] ease-out group-hover:scale-[1.08] group-hover:shadow-[0_16px_35px_rgba(138,80,36,0.28)] md:mb-5 md:h-20 md:w-20">
                    <Icon className="h-6 w-6 text-ink md:h-8 md:w-8" />
                    {step.hasDot && (
                      <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-copper" />
                    )}
                    <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-copper bg-white text-[10px] font-mono font-bold text-copper-ink">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>

                  <div>
                    <p className="text-grad-copper text-xs font-bold uppercase tracking-[0.12em]">
                      {step.title}
                    </p>
                    <p className="mt-2 max-w-[190px] text-sm leading-[1.6] text-ink-soft">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
