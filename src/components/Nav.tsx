"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ServicesMenu } from "./ServicesMenu";
import { ArrowRight, PlusMinus } from "./ui/Icons";
import { Logo } from "./ui/Logo";
import { SERVICE_CATEGORIES } from "@/data/services";

const LINKS = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
];

type MobileSection = "services";

/** Visible, non-disabled elements a keyboard user can tab to, in DOM order. */
function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null);
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const [openSection, setOpenSection] = useState<MobileSection | null>(null);
  const pathname = usePathname();
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: MobileSection) =>
    setOpenSection((current) => (current === section ? null : section));

  const closeMenu = () => {
    setOpen(false);
    setOpenSection(null);
  };

  // Close on route change (back/forward nav, not just link clicks). Adjusted
  // during render rather than in an effect, per React's guidance for
  // resetting state in response to a prop/derived value changing.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) closeMenu();
  }

  // Prevent background scroll and hide the rest of the page from assistive
  // tech / keyboard focus while the full-screen menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const targets = document.querySelectorAll<HTMLElement>("#main, footer");
    targets.forEach((el) => {
      if (open) {
        el.setAttribute("inert", "");
        el.setAttribute("aria-hidden", "true");
      } else {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      }
    });
    return () => {
      document.body.style.overflow = "";
      targets.forEach((el) => {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      });
    };
  }, [open]);

  // Send focus into the menu on open, close on Escape, and trap Tab/Shift+Tab
  // to the toggle button plus the panel's own controls — the rest of the
  // page is inert, but without this a Tab at either end still escapes to
  // browser chrome instead of cycling back through the dialog.
  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        toggleBtnRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      const toggle = toggleBtnRef.current;
      if (!panel || !toggle) return;

      const focusables = [toggle, ...getFocusable(panel)];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !focusables.includes(active as HTMLElement)) {
          event.preventDefault();
          last.focus();
        }
      } else if (
        active === last ||
        !focusables.includes(active as HTMLElement)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-obsidian/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <Link
          href="/"
          tabIndex={open ? -1 : undefined}
          className="flex items-center text-cloud"
        >
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          <ServicesMenu />
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-cloud"
                  : "text-cloud-soft hover:text-cloud"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-full bg-copper px-5 py-2.5 text-sm font-medium text-obsidian transition-colors hover:bg-copper-light"
          >
            Start a project
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          ref={toggleBtnRef}
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          onClick={() => (open ? closeMenu() : setOpen(true))}
          className="-mr-1 flex h-11 w-11 flex-col items-center justify-center gap-[5px] lg:hidden"
        >
          <span
            className={`h-px w-6 bg-cloud transition-transform duration-200 ${
              open ? "translate-y-[3px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-px w-6 bg-cloud transition-transform duration-200 ${
              open ? "-translate-y-[3px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>
    </header>

      {/* Rendered as a sibling of <header>, not a child: the header gets a
          conditional backdrop-blur (backdrop-filter) when open, and filter/
          backdrop-filter on an ancestor creates a new containing block for
          position:fixed descendants — nesting this panel inside would size
          it against the header's own box instead of the viewport. Unmounts
          synchronously — an exit animation that stalls would leave an
          invisible, still-focusable panel over the page. */}
      {open && (
        <div
          ref={panelRef}
          id="mobile-nav-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="animate-drawer-in fixed inset-x-0 top-[4.5rem] bottom-0 z-40 flex flex-col overflow-y-auto border-t border-line bg-obsidian px-6 pb-10 pt-2 lg:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-1 flex-col">
            <Link
              ref={firstLinkRef}
              href="/"
              onClick={closeMenu}
              aria-current={pathname === "/" ? "page" : undefined}
              className="border-b border-line/70 py-4 text-base font-medium text-cloud"
            >
              Home
            </Link>

            <div className="border-b border-line/70">
              <button
                type="button"
                onClick={() => toggleSection("services")}
                aria-expanded={openSection === "services"}
                aria-controls="mobile-services-panel"
                className="flex w-full items-center justify-between py-4 text-left active:opacity-70"
              >
                <span className="text-base font-medium text-cloud">
                  Services
                </span>
                <PlusMinus
                  open={openSection === "services"}
                  className="h-3.5 w-3.5 text-cloud-faint"
                />
              </button>
              <div
                id="mobile-services-panel"
                className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
                style={{
                  gridTemplateRows: openSection === "services" ? "1fr" : "0fr",
                }}
              >
                <ul className="overflow-hidden divide-y divide-line/70 pb-1">
                  {SERVICE_CATEGORIES.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/services/${category.slug}`}
                        onClick={closeMenu}
                        className="flex items-baseline gap-3 py-3.5 pl-1 text-[15px] text-cloud-soft transition-colors active:text-cloud"
                      >
                        <span className="font-mono text-[10px] text-copper">
                          {category.number}
                        </span>
                        {category.title}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/services"
                      onClick={closeMenu}
                      className="group flex items-center gap-2 py-3.5 pl-1 text-[15px] font-medium text-copper transition-colors active:text-copper-light"
                    >
                      All services
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                aria-current={pathname === link.href ? "page" : undefined}
                className="border-b border-line/70 py-4 text-base font-medium text-cloud"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/contact"
              onClick={closeMenu}
              className="mt-7 flex items-center justify-center gap-2 rounded-full bg-copper px-5 py-3.5 text-sm font-medium text-obsidian transition-colors active:bg-copper-light"
            >
              Start a project
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
