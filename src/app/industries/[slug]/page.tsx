import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { ArrowRight } from "@/components/ui/Icons";
import { CTA } from "@/components/CTA";
import { JsonLd } from "@/components/JsonLd";
import { INDUSTRIES, getIndustry } from "@/data/industries";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return INDUSTRIES.map((industry) => ({ slug: industry.slug }));
}

// Only these ten slugs are ever valid, so an unlisted one should 404 at the
// routing layer rather than rendering a dynamic fallback — mirrors
// services/[slug]'s dynamicParams = false for the same reason.
export const dynamicParams = false;

export async function generateMetadata(
  props: PageProps<"/industries/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const industry = getIndustry(slug);

  if (!industry) return { title: "Industries | ParaTech" };

  const title = `${industry.title} | ParaTech`;

  return {
    title,
    description: industry.short,
    alternates: { canonical: `/industries/${industry.slug}` },
    openGraph: {
      title,
      description: industry.short,
      url: `/industries/${industry.slug}`,
    },
    twitter: { title, description: industry.short },
  };
}

export default async function IndustryPage(
  props: PageProps<"/industries/[slug]">
) {
  const { slug } = await props.params;
  const industry = getIndustry(slug);

  if (!industry) notFound();

  // A few, not all nine — this is a "see more" nudge, not a full directory.
  const others = INDUSTRIES.filter((item) => item.slug !== slug).slice(0, 3);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `AI Automation for ${industry.title}`,
    description: industry.short,
    provider: { "@type": "ProfessionalService", name: SITE.name, url: SITE.url },
    areaServed: "Worldwide",
    audience: { "@type": "Audience", audienceType: industry.subtitle },
    url: `${SITE.url}/industries/${industry.slug}`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: industry.title,
      itemListElement: industry.services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          description: service.description,
        },
      })),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Industries", item: `${SITE.url}/industries` },
      { "@type": "ListItem", position: 2, name: industry.title, item: `${SITE.url}/industries/${industry.slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={serviceSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-obsidian pt-36 pb-20 sm:pt-44 lg:pt-52 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
        <div className="pointer-events-none absolute inset-0 bg-radial-copper" />

        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-xs text-cloud-faint">
              <li>
                <Link href="/industries" className="hover:text-cloud">
                  Industries
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-cloud-soft">{industry.title}</li>
            </ol>
          </nav>

          <div className="mt-8 max-w-2xl">
            <Eyebrow>
              {industry.number} — {industry.title}
            </Eyebrow>
            <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-cloud sm:text-5xl">
              {industry.title}
            </h1>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-cloud-faint">
              {industry.subtitle}
            </p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cloud-soft">
              {industry.short}
            </p>
            <Link
              href={`/contact?service=${encodeURIComponent(industry.title)}`}
              className="group mt-9 inline-flex items-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-medium text-obsidian transition-colors hover:bg-copper-light"
            >
              Get an automation assessment
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <Section tone="light">
        <SectionHeading
          tone="light"
          eyebrow="What's already costing you"
          title={`Where ${industry.title} loses time and revenue.`}
        />
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {industry.painPoints.map((point, i) => (
            <Reveal key={point} delay={i * 0.05}>
              <div className="flex h-full items-start gap-3 rounded-xl border border-line-light bg-bone/40 p-6">
                <span
                  aria-hidden="true"
                  className="mt-[7px] h-[6px] w-[6px] shrink-0 bg-copper-ink"
                />
                <p className="text-[15px] leading-relaxed text-ink-soft">
                  {point}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Services */}
      <Section tone="dark">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
        <SectionHeading
          eyebrow="What we build for you"
          title={`Every ${industry.title} engagement can include.`}
        />
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {industry.services.map((service, i) => (
            <Reveal key={service.title} delay={i * 0.04}>
              <div className="flex h-full flex-col bg-obsidian p-7">
                <span className="font-mono text-[10px] text-copper">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-cloud">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-cloud-soft">
                  {service.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Other industries */}
      <Section tone="light">
        <SectionHeading
          tone="light"
          eyebrow="Also available"
          title="More industries we work in."
          lead="Ten sectors in total, each with its own playbook of pain points and fixes."
        />
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {others.map((item, i) => (
            <Reveal key={item.slug} delay={i * 0.05}>
              <Link
                href={`/industries/${item.slug}`}
                className="group flex h-full flex-col rounded-xl border border-line-light bg-bone/40 p-6 transition-colors hover:border-ink/25 hover:bg-bone/70"
              >
                <span className="font-mono text-xs text-copper-ink">
                  {item.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                  {item.short}
                </p>
                <ArrowRight className="mt-5 h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-copper-ink" />
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <CTA
        primaryLabel="Get an automation assessment"
        primaryHref={`/contact?service=${encodeURIComponent(industry.title)}`}
      />
    </>
  );
}
