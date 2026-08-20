import Link from "next/link";
import { Logo } from "./ui/Logo";
import { SERVICE_CATEGORIES } from "@/data/services";

const COMPANY = [
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Process", href: "/#process" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-obsidian">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-8 lg:px-8 lg:pt-20 lg:pb-10">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center text-cloud">
              <Logo />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cloud-soft">
              A digital growth, technology, and AI automation partner. We design,
              build, grow, and automate the systems behind modern businesses.
            </p>
            <a
              href="mailto:hello@paratech.agency"
              className="mt-6 inline-block text-sm font-medium text-copper transition-colors hover:text-cloud"
            >
              hello@paratech.agency
            </a>
          </div>

          <nav aria-labelledby="footer-services">
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
