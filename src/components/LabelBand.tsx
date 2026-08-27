import type { CSSProperties, ReactNode } from "react";

const SECTORS = [
  "Home & field services",
  "Hospitality",
  "Multi-location retail",
  "Logistics & freight",
  "Professional services",
  "Healthcare & clinics",
  "Property",
  "E-commerce",
];

const TOOLS = [
  "Next.js",
  "TypeScript",
  "Python",
  "Language models",
  "CRM integrations",
  "WhatsApp & SMS",
  "Google Ads",
  "Google Business Profile",
  "Analytics & attribution",
  "Postgres",
  "Webhooks & APIs",
  "Scheduled reporting",
];

/**
 * One marquee row. The row is repeated `copies` times and every repeat after
 * the first is hidden from assistive tech, so the loop can shift by exactly
 * one copy with no seam and no duplicate reading.
 */
function Marquee({
  items,
  speed = 38,
  gap = "1rem",
  copies = 4,
  render,
}: {
  items: readonly string[];
  /** Seconds for one full pass. 34–42s is the honest range. */
  speed?: number;
  gap?: string;
  copies?: number;
  render: (item: string) => ReactNode;
}) {
  return (
    <div className="marquee relative">
      <div className="marquee-viewport">
        <div
          className="marquee-track"
          style={
            {
              "--speed": `${speed}s`,
              "--gap": gap,
              "--shift": `-${100 / copies}%`,
            } as CSSProperties
          }
        >
          {Array.from({ length: copies }, (_, copy) => (
            <div
              key={copy}
              className="marquee-copy"
              aria-hidden={copy > 0 ? "true" : undefined}
            >
              {items.map((item) => (
                <span key={item}>{render(item)}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LabelBand() {
  return (
    <section className="overflow-clip border-y border-line-light/60 bg-bone py-10 sm:py-12 lg:py-14">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Label centred between two hairlines that fade out at both ends.
            Below sm the label takes both lines it needs and the rules would
            be squeezed to nothing, so they only appear once there is room. */}
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-8">
          <span
            aria-hidden="true"
            className="hidden h-px bg-[linear-gradient(to_right,transparent,var(--color-line-light),transparent)] sm:block"
          />
          <span className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
            Built for operators, in the tools they already run on
          </span>
          <span
            aria-hidden="true"
            className="hidden h-px bg-[linear-gradient(to_right,transparent,var(--color-line-light),transparent)] sm:block"
          />
        </div>
      </div>

      <div className="mt-8 lg:mt-10">
        <Marquee
          items={SECTORS}
          speed={42}
          gap="1rem"
          render={(item) => (
            <span className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full bg-[#fbf9f4] px-5 py-2.5 text-base font-semibold tracking-[-0.01em] text-ink shadow-[0_0_0_1px_rgba(21,23,28,0.08),0_2px_6px_rgba(23,32,63,0.05)]">
              {/* A square, not a circle — it reads as a mark rather than a
                  bullet. */}
              <span
                aria-hidden="true"
                className="h-[7px] w-[7px] rounded-[2px] bg-copper opacity-80"
              />
              {item}
            </span>
          )}
        />

        <div className="mt-4">
          <Marquee
            items={TOOLS}
            speed={34}
            gap=".6rem"
            render={(item) => (
              <span className="inline-flex items-center whitespace-nowrap rounded-full border border-line-light px-3.5 py-1.5 text-[13px] font-medium text-ink-soft">
                {item}
              </span>
            )}
          />
        </div>
      </div>
    </section>
  );
}
