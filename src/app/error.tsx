"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Section";
import { ArrowRight } from "@/components/ui/Icons";
import { SITE } from "@/lib/site";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="relative overflow-hidden bg-obsidian pt-36 pb-24 sm:pt-44 lg:pt-52 lg:pb-32">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
      <div className="pointer-events-none absolute inset-0 bg-radial-copper" />

      <div className="relative mx-auto max-w-2xl px-6 lg:px-8">
        <Eyebrow>Something went wrong</Eyebrow>
        <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-cloud sm:text-5xl">
          That didn&apos;t load right.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-cloud-soft">
          Something broke on our end, not yours. Try again, or reach us
          directly at {SITE.email} if it keeps happening.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="group inline-flex items-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-medium text-obsidian transition-colors hover:bg-copper-light"
          >
            Try again
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-cloud/15 px-6 py-3 text-sm font-medium text-cloud transition-colors hover:border-cloud/35 hover:bg-cloud/5"
          >
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
