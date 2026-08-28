import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { ArrowRight, GridMark } from "@/components/ui/Icons";
import { CTA } from "@/components/CTA";
import { JsonLd } from "@/components/JsonLd";
import { SERVICE_CATEGORIES, getServiceCategory } from "@/data/services";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return SERVICE_CATEGORIES.map((category) => ({ slug: category.slug }));
}

// Only these four slugs are ever valid, so an unlisted one should 404 at
// the routing layer rather than rendering a dynamic fallback — without
// this, notFound() renders the right content but ships it with a 200.
export const dynamicParams = false;

export async function generateMetadata(
  props: PageProps<"/services/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = getServiceCategory(slug);

  if (!category) return { title: "Services | ParaTech" };

  const title = `${category.title} | ParaTech`;

  return {
    title,
    description: category.short,
    alternates: { canonical: `/services/${category.slug}` },
    openGraph: {
      title,
      description: category.short,
      url: `/services/${category.slug}`,
    },
    twitter: { title, description: category.short },
  };
}

export default async function ServiceCategoryPage(
  props: PageProps<"/services/[slug]">
) {
  const { slug } = await props.params;
  const category = getServiceCategory(slug);

  if (!category) notFound();

  const others = SERVICE_CATEGORIES.filter((item) => item.slug !== slug);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: category.title,
    description: category.intro,
    provider: { "@type": "ProfessionalService", name: SITE.name, url: SITE.url },
    areaServed: "Worldwide",
    url: `${SITE.url}/services/${category.slug}`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: category.title,
      itemListElement: category.services.map((service) => ({
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
      { "@type": "ListItem", position: 1, name: "Services", item: `${SITE.url}/services` },
      { "@type": "ListItem", position: 2, name: category.title, item: `${SITE.url}/services/${category.slug}` },
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
                <Link href="/services" className="hover:text-cloud">
                  Services
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-cloud-soft">{category.title}</li>
            </ol>
          </nav>

          <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <Eyebrow>
                {category.number} — {category.title}
              </Eyebrow>
              <h1 className="mt-5 max-w-2xl text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-cloud sm:text-5xl">
                {category.headline}
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-cloud-soft">
                {category.intro}
              </p>
              <Link
                href={`/contact?service=${encodeURIComponent(category.title)}`}
                className="group mt-9 inline-flex items-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-medium text-obsidian transition-colors hover:bg-copper-light"
              >
                {category.ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="rounded-xl border border-line bg-deep/70 p-7 lg:p-8">
              <div className="flex items-start justify-between">
                <GridMark />
                <span className="font-mono text-3xl font-semibold text-cloud/10">
                  {category.number}
                </span>
              </div>
              <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.18em] text-cloud-faint">
                What you get
              </p>
              <p className="mt-3 text-xl font-semibold leading-snug tracking-[-0.02em] text-cloud">
                {category.outcome}
              </p>
              <ul className="mt-7 flex flex-col gap-3 border-t border-line pt-6">
                {category.services.slice(0, 4).map((service) => (
                  <li
                    key={service.title}
                    className="flex items-start gap-2.5 text-sm text-cloud-soft"
                  >
                    <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-copper" />
                    {service.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Full service list */}
      <Section tone="light">
        <SectionHeading
          tone="light"
          eyebrow="What's included"
          title={`Everything we do inside ${category.title}.`}
        />
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line-light bg-line-light sm:grid-cols-2">
          {category.services.map((service, i) => (
            <Reveal key={service.title} delay={i * 0.04}>
              <div className="flex h-full flex-col bg-ivory p-7">
                <span className="font-mono text-[10px] text-copper-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-ink">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {service.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Other capabilities */}
      <Section tone="light">
        <SectionHeading
          tone="light"
          eyebrow="Also available"
          title="The other three capabilities."
          lead="Each one stands on its own, and they compound when combined."
        />
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {others.map((item, i) => (
            <Reveal key={item.slug} delay={i * 0.05}>
              <Link
                href={`/services/${item.slug}`}
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
        primaryLabel={category.ctaLabel}
        primaryHref={`/contact?service=${encodeURIComponent(category.title)}`}
      />
    </>
  );
}
