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

export function ClipboardIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M9 4.5h6a1 1 0 0 1 1 1V6h1.5A1.5 1.5 0 0 1 19 7.5v11A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-11A1.5 1.5 0 0 1 6.5 6H8v-.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.5h4M9.5 15.5h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="m14.5 12.5 2-2M16.5 10.5v1.6M16.5 10.5h-1.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GearIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FlowIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="10" y="4" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="5" y="16" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="15" y="16" width="4" height="4" rx="0.6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12 8v4m0 0-4.5 4m4.5-4 4.5 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BellIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 5c-2.5 0-4 2-4 4.5v2.3c0 .6-.2 1.2-.6 1.7l-.9 1.1c-.5.6-.1 1.4.6 1.4h11.8c.7 0 1.1-.8.6-1.4l-.9-1.1c-.4-.5-.6-1.1-.6-1.7V9.5c0-2.5-1.5-4.5-4-4.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.3 18.5a1.8 1.8 0 0 0 3.4 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChartUpIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5 19V13M10 19V9M15 19v-6M20 19V6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="m14.5 6.5 3.7-.4.4 3.7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 12.5 11 7l3 3 4.5-4.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckCircleIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="m8.7 12.3 2.2 2.2 4.4-4.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InstagramIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.1" cy="6.9" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function LinkedInIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="7.6" cy="8.5" r="1.05" fill="currentColor" />
      <path
        d="M7.6 10.9v5.6M11.6 16.5v-5.6M11.6 12.7c0-1.3.9-2.2 2.1-2.2s2 .9 2 2.2v3.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
