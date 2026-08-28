import Image from "next/image";

/**
 * Brand lockup: PT mark | PARATECH.
 *
 * The mark ships as two pre-rendered PNGs (public/brand/) rather than inline
 * SVG — it's an illustrated ribbon-fold treatment with gradients and shading
 * that can't be reduced to flat vector fills. Because it can no longer
 * recolor itself via `fill-current`, the two variants stand in for light vs.
 * dark surfaces: pick "white" wherever the mark sits on a dark surface
 * (nav, footer), "black" wherever it sits on a light one.
 */
const MARK = {
  white: { src: "/brand/paratech-mark-white.png", width: 722, height: 760 },
  black: { src: "/brand/paratech-mark-black.png", width: 657, height: 760 },
} as const;

export function Logo({
  className = "",
  size = "md",
  dark = true,
}: {
  className?: string;
  size?: "md" | "lg";
  /** Which mark variant to use — true (default) for dark surfaces, false for light ones. */
  dark?: boolean;
}) {
  const isLarge = size === "lg";
  const mark = dark ? MARK.white : MARK.black;

  return (
    <span className={`flex items-center ${className}`}>
      <Image
        src={mark.src}
        width={mark.width}
        height={mark.height}
        alt=""
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
