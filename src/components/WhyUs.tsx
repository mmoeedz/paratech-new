import { Reveal } from "./Reveal";
import { Section, SectionHeading } from "./ui/Section";
import { SERVICE_CATEGORIES } from "@/data/services";

const COMPARISON = [
  {
    fragmented: "Four vendors, four invoices, four versions of the truth",
    connected: "One team accountable for the whole system",
  },
  {
    fragmented: "Ads driving traffic to a site nobody optimised",
    connected: "Campaigns and landing pages designed together",
  },
  {
    fragmented: "Automation bolted on after the software is finished",
    connected: "Workflows designed into the build from week one",
  },
  {
    fragmented: "Reporting assembled by hand from disconnected tools",
    connected: "One live view because the data was unified deliberately",
  },
];

export function WhyUs() {
  return (
    <Section tone="light">
      <SectionHeading
        tone="light"
        eyebrow="Why one partner"
        title="The gaps between vendors are where projects fail."
        lead="It isn't that specialists are bad. It's that nobody owns the seams — and the seams are where your money goes."
      />

      <div className="mt-14 overflow-hidden rounded-xl border border-line-light">
        <div className="grid grid-cols-1 divide-y divide-line-light sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="bg-bone/40 px-6 py-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Fragmented
            </p>
          </div>
          <div className="bg-ink px-6 py-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-copper">
              One connected system
            </p>
          </div>
        </div>

        {COMPARISON.map((row, i) => (
          <Reveal key={row.connected} delay={i * 0.05}>
            <div className="grid grid-cols-1 divide-y divide-line-light border-t border-line-light sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="px-6 py-5">
                <p className="text-sm leading-relaxed text-ink-faint">
                  {row.fragmented}
                </p>
              </div>
              <div className="bg-bone/30 px-6 py-5">
                <p className="text-sm font-medium leading-relaxed text-ink">
                  {row.connected}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-4 rounded-xl border border-line-light bg-bone/40 px-6 py-8 text-center">
          {SERVICE_CATEGORIES.map((category, i) => (
            <span key={category.slug} className="flex items-center gap-3">
              <span className="text-base font-semibold tracking-[-0.01em] text-ink sm:text-lg">
                {category.title}
              </span>
              {i < SERVICE_CATEGORIES.length - 1 && (
                <span aria-hidden="true" className="text-copper-ink">
                  +
                </span>
              )}
            </span>
          ))}
          <span aria-hidden="true" className="text-copper-ink">
            =
          </span>
          <span className="text-base font-semibold tracking-[-0.01em] text-copper-ink sm:text-lg">
            One connected system
          </span>
        </div>
      </Reveal>
    </Section>
  );
}
