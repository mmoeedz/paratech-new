"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Eyebrow } from "./ui/Section";
import { ChevronRight } from "./ui/Icons";
import { HeroVisual } from "./HeroVisual";

const CAPABILITIES = [
  "AI & Automation",
  "Web & Software",
  "Growth & Marketing",
  "Data & Analytics",
];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Subtle parallax: the glow drifts down and fades as the hero scrolls
  // out of view, rather than moving in lockstep with the content.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.25]);

  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-obsidian pt-36 pb-20 sm:pt-44 lg:pt-52 lg:pb-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
      {reduceMotion ? (
        <div className="pointer-events-none absolute inset-0 bg-radial-copper" />
      ) : (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-radial-copper"
          style={{ y: glowY, opacity: glowOpacity }}
        />
      )}

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.3fr_0.7fr] lg:gap-12">
          <div>
            <motion.div {...rise(0)}>
              <Eyebrow>Digital systems · AI automation · Growth</Eyebrow>
            </motion.div>

            <motion.h1
              {...rise(0.08)}
              className="mt-7 text-balance font-display text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.025em] text-cloud sm:text-6xl lg:text-[3.75rem]"
            >
              We build and automate the systems{" "}
              <span className="text-copper">businesses run on.</span>
            </motion.h1>

            <motion.p
              {...rise(0.16)}
              className="mt-7 max-w-xl text-balance text-xl leading-relaxed text-cloud-soft"
            >
              One partner for your website, software, growth, and AI workflows.
            </motion.p>

            <motion.div
              {...rise(0.24)}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-copper-light to-copper px-8 py-3.5 text-[15px] font-bold text-obsidian shadow-[0_10px_30px_-10px_rgba(192,128,64,0.75)] transition-all hover:from-copper hover:to-copper-ink hover:shadow-[0_12px_34px_-10px_rgba(192,128,64,0.9)]"
              >
                Start a project
              </Link>
              <Link
                href="/services"
                className="group inline-flex items-center justify-center gap-2 rounded-lg border border-copper/45 px-8 py-3.5 text-[15px] font-bold text-copper transition-colors hover:border-copper hover:bg-copper/[0.07]"
              >
                Our Services
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>

          {/* Decorative only — hidden on small screens, where it would push
              the CTAs below the fold for no informational gain. */}
          <motion.div
            {...rise(0.3)}
            className="hidden justify-center sm:flex lg:justify-end"
          >
            <HeroVisual />
          </motion.div>
        </div>

        <motion.ul
          {...rise(0.32)}
          className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-6"
        >
          {CAPABILITIES.map((capability) => (
            <li
              key={capability}
              className="flex items-center gap-2 text-sm text-cloud-soft"
            >
              <span className="h-[3px] w-[3px] rounded-full bg-copper" />
              {capability}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
