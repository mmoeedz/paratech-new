import Link from "next/link";
import { Reveal } from "./Reveal";
import { Section, SectionHeading } from "./ui/Section";
import { ArrowRight } from "./ui/Icons";

const LINKS = [
  {
    number: "01",
    title: "Work",
    description:
      "Engagements across automation, software, growth, and reporting — with the problem and the outcome for each.",
    href: "/work",
  },
  {
    number: "02",
    title: "About",
    description:
      "Who you'd actually be working with, and the commitments we hold ourselves to.",
    href: "/about",
  },
];

export function ExploreLinks() {
  return (
    <Section tone="dark">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark" />

      <SectionHeading
        eyebrow="Explore"
        title="See how we work, and who we are."
      />

      <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
        {LINKS.map((link, i) => (
          <Reveal key={link.href} delay={i * 0.05}>
            <Link
              href={link.href}
              className="group flex h-full flex-col bg-obsidian p-6 transition-colors duration-300 hover:bg-deep"
            >
              <span className="font-mono text-[10px] text-copper">
                {link.number}
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-cloud">
                {link.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-cloud-soft">
                {link.description}
              </p>
              <ArrowRight className="mt-5 h-4 w-4 text-cloud-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-copper" />
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
