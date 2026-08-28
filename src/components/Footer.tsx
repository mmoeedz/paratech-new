import Link from "next/link";
import { Logo } from "./ui/Logo";
import { SERVICE_CATEGORIES } from "@/data/services";
import { SITE } from "@/lib/site";
import { InstagramIcon, LinkedInIcon } from "./ui/Icons";

const SOCIAL = [
  { label: "Instagram", href: SITE.social.instagram, Icon: InstagramIcon },
  { label: "LinkedIn", href: SITE.social.linkedin, Icon: LinkedInIcon },
];

const COMPANY = [
  { label: "Work", href: "/work" },
  { label: "Process", href: "/#process" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
];

// A representative handful, not the full ten — enough for a visitor to
// immediately place what "Industries" covers without the column dwarfing
// Services and Company beside it. The full breakdown lives at /industries.
// Labels are shortened on purpose (e.g. "E-commerce" instead of the full
// "Retail, E-commerce & Automotive" category title).
const FEATURED_INDUSTRIES = [
  { label: "Real Estate", slug: "real-estate" },
  { label: "Home & Property Services", slug: "home-property-services" },
  { label: "E-commerce", slug: "retail-ecommerce-automotive" },
  { label: "Hospitality & Food", slug: "hospitality-food" },
  { label: "Healthcare & Wellness", slug: "healthcare-wellness-beauty" },
  { label: "Marketing & Outsourcing", slug: "marketing-outsourcing-tech" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-obsidian">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-8 lg:px-8 lg:pt-20 lg:pb-10">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center text-cloud">
              <Logo size="lg" />
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-cloud-soft">
              A digital growth, technology, and AI automation partner. We design,
              build, grow, and automate the systems behind modern businesses.
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-6 inline-block text-sm font-medium text-copper transition-colors hover:text-cloud"
            >
              {SITE.email}
            </a>

            <div className="mt-6 flex items-center gap-4">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Paratech on ${label}`}
                  className="text-cloud-soft transition-colors hover:text-copper"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-labelledby="footer-services" className="mt-10 lg:mt-0 lg:ml-10">
            <p
              id="footer-services"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-cloud-faint"
            >
              Services
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {SERVICE_CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/services/${category.slug}`}
                    className="text-sm text-cloud-soft transition-colors hover:text-copper"
                  >
                    {category.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/services"
                  className="text-sm font-medium text-copper transition-colors hover:text-cloud"
                >
                  All services
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-industries" className="mt-10 lg:mt-0">
            <p
              id="footer-industries"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-cloud-faint"
            >
              Industries
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {FEATURED_INDUSTRIES.map((industry) => (
                <li key={industry.slug}>
                  <Link
                    href={`/industries/${industry.slug}`}
                    className="text-sm text-cloud-soft transition-colors hover:text-copper"
                  >
                    {industry.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/industries"
                  className="text-sm font-medium text-copper transition-colors hover:text-cloud"
                >
                  All industries
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-company">
            <p
              id="footer-company"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-cloud-faint"
            >
              Company
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {COMPANY.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-cloud-soft transition-colors hover:text-copper"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <p className="text-xs text-cloud-faint">
            © {new Date().getFullYear()} Paratech. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
