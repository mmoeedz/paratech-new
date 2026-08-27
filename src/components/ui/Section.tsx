import type { ReactNode } from "react";

type Tone = "dark" | "light";

/** Pill-shaped label that opens a section. */
export function Eyebrow({
  children,
  tone = "dark",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-block rounded-full border px-3.5 py-1.5 text-[13px] font-semibold uppercase tracking-[0.18em] ${
        tone === "dark"
          ? "border-copper/25 bg-copper/[0.08] text-copper"
          : "border-copper/20 bg-copper/[0.06] text-copper-ink"
      }`}
    >
      {children}
    </span>
  );
}

/** Page/section wrapper that owns the vertical rhythm and max width. */
export function Section({
  children,
  tone = "dark",
  isPageTop = false,
  className = "",
  id,
}: {
  children: ReactNode;
  tone?: Tone;
  isPageTop?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`relative ${
        tone === "dark" ? "bg-obsidian" : "bg-ivory"
      } ${isPageTop ? "pt-36 pb-24 sm:pt-44 sm:pb-28 lg:pt-52 lg:pb-36" : "py-24 sm:py-28 lg:py-36"} ${className}`}
    >
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">{children}</div>
    </section>
  );
}

/** Consistent heading + lead pairing used at the top of every section. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "dark",
  as = "h2",
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: Tone;
  as?: "h1" | "h2";
  align?: "left" | "center";
}) {
  const Heading = as;
  const isDark = tone === "dark";

  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <Heading
        className={`mt-5 text-balance font-display font-semibold tracking-[-0.025em] ${
          as === "h1"
            ? "text-4xl leading-[1.05] sm:text-5xl lg:text-6xl"
            : "text-3xl leading-[1.1] sm:text-4xl"
        } ${isDark ? "text-cloud" : "text-ink"}`}
      >
        {title}
      </Heading>
      {lead && (
        <p
          className={`mt-6 max-w-xl text-balance text-lg leading-relaxed ${
            align === "center" ? "mx-auto" : ""
          } ${isDark ? "text-cloud-soft" : "text-ink-soft"}`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
