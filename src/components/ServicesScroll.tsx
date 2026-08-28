"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, GridMark } from "./ui/Icons";
import { Eyebrow } from "./ui/Section";
import { Reveal } from "./Reveal";
import { SERVICE_CATEGORIES } from "@/data/services";

/** Scroll distance (in vh) allotted to each capability. */
const VH_PER_STEP = 85;

const COUNT = SERVICE_CATEGORIES.length;

type CardProps = {
  category: (typeof SERVICE_CATEGORIES)[number];
  /** Boxes alternate dark/light as you step through them. */
  dark: boolean;
  /**
   * Stagger the contents in. Only the pinned desktop card uses this — the
   * mobile stack renders all four at once, where replaying an entrance on
   * every card would just be noise.
   */
  animated?: boolean;
};

function CapabilityCard({ category, dark, animated = false }: CardProps) {
  const step = (i: number) =>
    animated
      ? { className: "animate-line-in", style: { animationDelay: `${i * 60}ms` } }
      : { className: "", style: undefined };

  return (
    <div
      className={`flex flex-col border p-8 lg:h-[470px] lg:p-10 ${
        dark ? "border-line bg-obsidian" : "border-line-light bg-bone"
      }`}
    >
      <div className="flex items-start justify-between">
        <GridMark dark={dark} />
        <span
          className={`font-mono text-3xl font-semibold leading-none ${
            dark ? "text-copper/40" : "text-ink/10"
          }`}
        >
          {category.number}
        </span>
      </div>

      <h3
        {...step(0)}
        className={`${step(0).className} mt-7 text-2xl font-semibold tracking-[-0.02em] ${
          dark ? "text-cloud" : "text-ink"
        }`}
      >
        {category.title}
      </h3>
      <p
        {...step(1)}
        className={`${step(1).className} mt-3 text-[15px] leading-relaxed ${
          dark ? "text-cloud-soft" : "text-ink-soft"
        }`}
      >
        {category.short}
      </p>

      <p
        {...step(2)}
        className={`${step(2).className} mt-6 flex items-center gap-2.5 text-[15px] font-medium ${
          dark ? "text-cloud" : "text-ink"
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-[6px] w-[6px] shrink-0 ${
            dark ? "bg-copper" : "bg-copper-ink"
          }`}
        />
        {category.outcome}
      </p>

      <ul className="mt-5 flex flex-col">
        {category.services.slice(0, 4).map((service, i) => (
          <li
            key={service.title}
            {...step(3 + i)}
            className={`${step(3 + i).className} flex items-center gap-2.5 border-b py-2.5 ${
              dark ? "border-line" : "border-line-light"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-[5px] w-[5px] shrink-0 ${
                dark ? "bg-copper" : "bg-copper-ink"
              }`}
            />
            <span
              className={`text-[13px] font-medium ${
                dark ? "text-cloud" : "text-ink"
              }`}
            >
              {service.title}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={`/services/${category.slug}`}
        {...step(7)}
        className={`${step(7).className} group mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold transition-colors ${
          dark ? "text-cloud hover:text-copper" : "text-ink hover:text-copper-ink"
        }`}
      >
        See the full service
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

export function ServicesScroll() {
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  // Scroll position inside the tall track decides which capability is shown,
  // so the viewport stays pinned while the card advances.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let frame = 0;
    const read = () => {
      frame = 0;
      const span = el.offsetHeight - window.innerHeight;
      if (span <= 0) return;
      const progress = Math.min(
        Math.max(-el.getBoundingClientRect().top / span, 0),
        0.9999
      );
      // Written straight to the DOM: this changes every frame, and routing it
      // through state would re-render the whole section on each one.
      if (railRef.current) {
        railRef.current.style.transform = `scaleY(${progress})`;
      }
      setActive(Math.floor(progress * COUNT));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const goTo = useCallback((index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const span = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + (span * (index + 0.5)) / COUNT,
      behavior: "smooth",
    });
  }, []);

  const activeCategory = SERVICE_CATEGORIES[active];

  return (
    <section className="relative bg-ivory">
      {/* Mobile / tablet: a plain stack. Pinning a viewport-height panel on a
          short screen fights the user's scroll rather than helping it. */}
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28 lg:hidden">
        <Eyebrow tone="light">Services</Eyebrow>
        <h2 className="mt-5 text-balance font-display text-3xl font-bold leading-[1.1] tracking-[-0.025em] text-ink sm:text-4xl">
          Four capabilities. One stack.
        </h2>

        <div className="mt-12 flex flex-col gap-6">
          {SERVICE_CATEGORIES.map((category, i) => (
            <Reveal key={category.slug} delay={i * 0.05}>
              <CapabilityCard category={category} dark={i % 2 === 0} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* Desktop: tall track + sticky panel. */}
      <div
        ref={trackRef}
        className="hidden lg:block"
        style={{ height: `${COUNT * VH_PER_STEP}vh` }}
      >
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_1.15fr] items-center gap-16 px-8 pt-16">
            <div>
              <Eyebrow tone="light">Services</Eyebrow>
              <h2 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.1] tracking-[-0.025em] text-ink xl:text-5xl">
                Four capabilities. One stack.
              </h2>

              <div className="relative mt-12 pl-6">
                {/* Rail: static groove plus a copper fill tracking scroll. */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-full w-px bg-line-light"
                />
                <span
                  ref={railRef}
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-full w-px origin-top bg-copper-ink"
                  style={{ transform: "scaleY(0)" }}
                />

                <ul className="flex flex-col">
                  {SERVICE_CATEGORIES.map((category, i) => {
                    const isActive = i === active;
                    return (
                      <li key={category.slug}>
                        <button
                          type="button"
                          onClick={() => goTo(i)}
                          onMouseEnter={() => setActive(i)}
                          onFocus={() => setActive(i)}
                          aria-current={isActive ? "true" : undefined}
                          // Tailwind v4 emits the standalone `translate`
                          // property, not `transform` — transitioning only
                          // `transform` would leave the shift un-eased.
                          className={`flex w-full items-center gap-5 border-b border-line-light py-4 text-left transition-[translate,opacity] duration-500 ease-out ${
                            isActive
                              ? "translate-x-1 opacity-100"
                              : "translate-x-0 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <span
                            className={`font-mono text-xs transition-colors duration-300 ${
                              isActive ? "text-copper-ink" : "text-ink-faint/60"
                            }`}
                          >
                            {category.number}
                          </span>
                          <span
                            className={`text-[15px] transition-colors duration-300 ${
                              isActive
                                ? "font-semibold text-ink"
                                : "font-medium text-ink-faint"
                            }`}
                          >
                            {category.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Keyed so the card re-mounts per step and replays its entrance. */}
            <div key={activeCategory.slug} className="animate-card-in">
              <CapabilityCard
                category={activeCategory}
                dark={active % 2 === 0}
                animated
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
