/**
 * Brand lockup: PT monogram | PARATECH.
 *
 * The monogram is inline SVG (no network request, sharp at any size). The "P"
 * is drawn with `fill-current` so it inherits the surrounding text colour —
 * charcoal on light surfaces, cloud on the dark header/footer — while the "T"
 * always carries the copper accent.
 */
function PTMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 190"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* P — top bar with a 45° cut, bowl, and the tail below it */}
      <path
        className="fill-current"
        d="M13 0 L150 0 C179 0 200 22 200 50 C200 78 179 100 150 100 L128 100 C114 104 107 114 104 128 C111 108 127 85 148 76 C163 71 172 62 172 50 C172 38 163 29 148 26 L38 26 Z"
      />
      {/* T — slanted bar with the stem dropping from its right end */}
      <path
        className="fill-copper"
        d="M0 37 L136 37 L100 64 L100 155 L70 185 L70 64 L26 64 Z"
      />
    </svg>
  );
}

export function Logo({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  const isLarge = size === "lg";

  return (
    <span className={`flex items-center ${className}`}>
      <PTMark
        className={
          isLarge
            ? "h-20 w-auto shrink-0 sm:h-24"
            : "h-7 w-auto shrink-0 sm:h-8"
        }
      />
      <span
        aria-hidden="true"
        className={
          isLarge
            ? "mx-4 h-8 w-px shrink-0 bg-current opacity-25 sm:mx-5 sm:h-9"
            : "mx-2.5 h-6 w-px shrink-0 bg-current opacity-25 sm:mx-3 sm:h-7"
        }
      />
      <span
        className={
          isLarge
            ? "text-xl font-semibold uppercase leading-none tracking-[0.2em] sm:text-2xl"
            : "text-[13px] font-semibold uppercase leading-none tracking-[0.2em] sm:text-[15px]"
        }
      >
        Paratech
      </span>
    </span>
  );
}
