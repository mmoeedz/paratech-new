import Link from "next/link";
import { Eyebrow } from "@/components/ui/Section";
import { ArrowRight } from "@/components/ui/Icons";
import { SERVICE_CATEGORIES } from "@/data/services";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-obsidian pt-36 pb-24 sm:pt-44 lg:pt-52 lg:pb-32">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
      <div className="pointer-events-none absolute inset-0 bg-radial-copper" />

      <div className="relative mx-auto max-w-2xl px-6 lg:px-8">
        <Eyebrow>Error 404</Eyebrow>
        <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-cloud sm:text-5xl">
          That page doesn&apos;t exist.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-cloud-soft">
          The link may be out of date. Here&apos;s where most people are headed.
        </p>

        <ul className="mt-10 flex flex-col divide-y divide-line border-y border-line">
          {SERVICE_CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/services/${category.slug}`}
                className="group flex items-center justify-between gap-4 py-4"
              >
                <span>
                  <span className="block text-base font-medium text-cloud">
                    {category.title}
                  </span>
                  <span className="mt-1 block text-sm text-cloud-soft">
                    {category.short}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-cloud-faint transition-transform group-hover:translate-x-1 group-hover:text-copper" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-medium text-obsidian transition-colors hover:bg-copper-light"
          >
            Back to home
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-cloud/15 px-6 py-3 text-sm font-medium text-cloud transition-colors hover:border-cloud/35 hover:bg-cloud/5"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
