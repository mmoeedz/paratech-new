import Link from "next/link";
import { Reveal } from "./Reveal";
import { Section, SectionHeading } from "./ui/Section";
import { ArrowRight } from "./ui/Icons";
import { SERVICE_CATEGORIES } from "@/data/services";

// The five strongest, most distinct services per category — trimmed from the
// full list (which stays intact on the category detail pages) so this card
// always shows exactly five lines.
const FEATURED: Record<string, string[]> = {
  "ai-automation": [
    "AI Lead Response & Qualification",
    "WhatsApp & SMS Automation",
    "Appointment & Follow-Up Automation",
    "Customer Support Automation",
    "AI Agents & Custom Solutions",
  ],
  "web-software": [
    "Web Development",
    "Web Design & UI/UX",
    "Landing Pages & Conversion Design",
    "E-commerce Platforms",
    "Custom Dashboards & Portals",
  ],
  "growth-marketing": [
    "SEO",
    "Local SEO",
    "Google Maps Optimization",
    "Google Ads & PPC",
    "Conversion Optimization",
  ],
  "data-analytics": [
    "Business Dashboards",
    "Automated Reporting",
    "KPI & Performance Tracking",
    "Attribution & Analytics",
    "Forecasting & Anomaly Detection",
  ],
};

export function Services() {
  return (
    <Section tone="light" isPageTop>
      <SectionHeading
        as="h1"
        tone="light"
        eyebrow="Services"
        title="Everything your digital business needs, under one roof."
        lead="Four connected capabilities. Engage one of them or all four — either way you get the same team, and systems that are designed to talk to each other."
      />

      <div className="mt-16 flex flex-col gap-14 sm:mt-20 lg:gap-16">
        {SERVICE_CATEGORIES.map((category, i) => {
          const reversed = i % 2 === 1;
          const dark = i % 2 === 0;
          const featured = FEATURED[category.slug];
          const services = featured
            ? category.services.filter((s) => featured.includes(s.title))
            : category.services.slice(0, 5);

          return (
            <Reveal key={category.slug} delay={i * 0.05}>
              <article className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
                <div className={reversed ? "lg:order-2" : undefined}>
                  <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
                    {category.title}
                  </h2>
                  <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
                    {category.intro}
                  </p>
                </div>

                <div
                  className={`flex h-full flex-col justify-between border p-6 lg:h-[300px] ${
                    reversed ? "lg:order-1" : ""
                  } ${dark ? "border-line bg-obsidian" : "border-line-light bg-ivory"}`}
                >
                  <ul className="flex flex-col">
                    {services.map((service) => (
                      <li
                        key={service.title}
                        className={`flex items-center gap-2.5 border-b py-2.5 ${
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
                          className={`text-[13px] font-medium leading-snug ${
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
                    className={`group mt-4 inline-flex items-center gap-2 text-[13px] font-semibold transition-colors ${
                      dark
                        ? "text-cloud hover:text-copper"
                        : "text-ink hover:text-copper-ink"
                    }`}
                  >
                    See the full service
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
