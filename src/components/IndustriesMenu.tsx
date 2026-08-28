"use client";

import { useState } from "react";
import Link from "next/link";
import { DropdownMenu } from "./ui/DropdownMenu";
import { ArrowRight } from "./ui/Icons";
import { INDUSTRIES } from "@/data/industries";

export function IndustriesMenu() {
  const [active, setActive] = useState(INDUSTRIES[0].slug);
  const activeIndustry =
    INDUSTRIES.find((industry) => industry.slug === active) ?? INDUSTRIES[0];

  return (
    <DropdownMenu label="Industries" href="/industries">
      {(close) => (
        <div className="grid grid-cols-[264px_1fr]">
          <div className="max-h-[420px] overflow-y-auto border-r border-line-light bg-ink/[0.03] p-5">
            <p className="px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Sectors
            </p>
            <ul className="mt-3 flex flex-col gap-0.5">
              {INDUSTRIES.map((industry) => (
                <li key={industry.slug}>
                  <Link
                    href={`/industries/${industry.slug}`}
                    onClick={close}
                    onMouseEnter={() => setActive(industry.slug)}
                    onFocus={() => setActive(industry.slug)}
                    className={`flex items-baseline gap-2.5 rounded-lg px-3 py-2 transition-colors ${
                      active === industry.slug
                        ? "bg-ink/[0.06]"
                        : "hover:bg-ink/[0.04]"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-copper-ink">
                      {industry.number}
                    </span>
                    <span className="text-sm font-semibold leading-snug text-ink">
                      {industry.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/industries"
              onClick={close}
              className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-copper-ink transition-colors hover:bg-ink/[0.04]"
            >
              All industries
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="p-6">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-copper-ink">
                {activeIndustry.title}
              </p>
              <Link
                href={`/industries/${activeIndustry.slug}`}
                onClick={close}
                className="group flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-ink"
              >
                See pain points &amp; services
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-x-7 gap-y-4">
              {activeIndustry.services.slice(0, 6).map((service) => (
                <li key={service.title}>
                  <Link
                    href={`/industries/${activeIndustry.slug}`}
                    onClick={close}
                    className="group block"
                  >
                    <span className="block text-sm font-semibold text-ink transition-colors group-hover:text-copper-ink">
                      {service.title}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-faint">
                      {service.description.length > 84
                        ? `${service.description.slice(0, 84).trimEnd()}…`
                        : service.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </DropdownMenu>
  );
}
