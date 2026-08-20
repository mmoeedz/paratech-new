type IconProps = {
  className?: string;
};

export function ArrowRight({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2.5 8h11M9 3.5 13.5 8 9 12.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRight({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="m4.5 2.5 3.5 3.5-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDown({ className = "h-3 w-3" }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Plus that flattens into a minus — used for the mobile accordion toggle. */
export function PlusMinus({
  open,
  className = "h-3 w-3",
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} aria-hidden="true">
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
      <span
        className={`absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current transition-transform duration-200 ease-out ${
          open ? "scale-y-0" : "scale-y-100"
        }`}
      />
    </span>
  );
}

/** Small 2x2 mark used as a quiet brand motif on cards. */
export function GridMark({
  className = "",
  dark = true,
}: IconProps & { dark?: boolean }) {
  const accent = dark ? "bg-copper" : "bg-copper-ink";
  const dot = dark ? "bg-cloud/20" : "bg-ink/20";
  return (
    <span className={`grid grid-cols-2 gap-[3px] ${className}`} aria-hidden="true">
      <span className={`h-[5px] w-[5px] rounded-[1px] ${accent}`} />
      <span className={`h-[5px] w-[5px] rounded-[1px] ${dot}`} />
      <span className={`h-[5px] w-[5px] rounded-[1px] ${dot}`} />
      <span className={`h-[5px] w-[5px] rounded-[1px] ${dot}`} />
    </span>
  );
}
