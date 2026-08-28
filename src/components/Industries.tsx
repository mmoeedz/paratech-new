import Link from "next/link";
import { Reveal } from "./Reveal";
import { Section, SectionHeading } from "./ui/Section";
import { ArrowRight } from "./ui/Icons";
import { INDUSTRIES } from "@/data/industries";

export function Industries() {
  return (
    <Section tone="light" isPageTop>
      <SectionHeading
        as="h1"
        tone="light"
        eyebrow="Industries"
        title="Built around how your industry actually works."
        lead="Ten sectors, each with its own pain points — and the specific AI automation and calling agent services that solve them."
      />

      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line-light bg-line-light sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((industry, i) => (
          <Reveal key={industry.slug} delay={i * 0.04}>
            <Link
              href={`/industries/${industry.slug}`}
              className="group flex h-full flex-col bg-ivory p-7 transition-colors hover:bg-bone/60"
            >
              <span className="font-mono text-[10px] text-copper-ink">
                {industry.number}
              </span>
              <h2 className="mt-4 text-lg font-semibold leading-snug tracking-[-0.01em] text-ink">
                {industry.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
                {industry.subtitle}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">
                {industry.short}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-ink transition-colors group-hover:text-copper-ink">
                See pain points &amp; services
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
