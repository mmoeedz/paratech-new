import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "./Icons";

type Variant = "primary" | "secondary" | "ghost";
type Tone = "dark" | "light";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors duration-200";

const styles: Record<Variant, Record<Tone, string>> = {
  primary: {
    dark: "bg-grad-copper text-ivory shadow-[0_10px_30px_-10px_rgba(138,80,36,0.6)] transition-shadow hover:shadow-[0_14px_36px_-10px_rgba(138,80,36,0.85)]",
    light: "bg-ink text-ivory hover:bg-copper-ink",
  },
  secondary: {
    dark: "border border-cloud/15 text-cloud hover:border-cloud/35 hover:bg-cloud/5",
    light:
      "border border-line-light text-ink hover:border-ink/35 hover:bg-ink/[0.04]",
  },
  ghost: {
    dark: "px-0 py-0 text-copper hover:text-cloud",
    light: "px-0 py-0 text-copper-ink hover:text-ink",
  },
};

export function Button({
  href,
  children,
  variant = "primary",
  tone = "dark",
  showArrow = true,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  tone?: Tone;
  showArrow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${styles[variant][tone]} ${className}`}
    >
      {children}
      {showArrow && (
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      )}
    </Link>
  );
}
