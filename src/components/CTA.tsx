"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Reveal } from "./Reveal";
import { ArrowRight } from "./ui/Icons";

export function CTA() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // As the CTA scrolls into view, the glow drifts up toward the headline —
  // a small nudge that draws the eye without being distracting.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-obsidian py-24 sm:py-28 lg:py-36"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
      {reduceMotion ? (
        <div className="pointer-events-none absolute inset-0 bg-radial-copper" />
      ) : (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-radial-copper"
          style={{ y: glowY }}
        />
      )}

      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
        <Reveal>
          <h2 className="text-balance font-display text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-cloud sm:text-4xl lg:text-5xl">
            Tell us what you&apos;re trying to fix.
          </h2>
        </Reveal>
        <Reveal delay={0.07}>
          <p className="mx-auto mt-6 max-w-lg text-balance text-lg leading-relaxed text-cloud-soft">
            One conversation is usually enough to find the workflow costing you
            the most — and whether it&apos;s worth automating.
          </p>
        </Reveal>
        <Reveal delay={0.14}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-medium text-obsidian transition-colors hover:bg-copper-light"
            >
              Start a project
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/work"
              className="group inline-flex items-center gap-2 rounded-full border border-cloud/15 px-6 py-3 text-sm font-medium text-cloud transition-colors hover:border-cloud/35 hover:bg-cloud/5"
            >
              See our work
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
