"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Nodes sitting on each orbit, as [x, y] in the 400×400 viewBox. */
const ORBIT_NODES = {
  inner: [
    [276, 200],
    [142, 249],
    [174, 129],
  ],
  mid: [
    [295, 280],
    [80, 232],
    [242, 84],
  ],
  outer: [
    [362, 259],
    [38, 141],
  ],
} as const;

/**
 * Abstract orbital composition for the hero. Deliberately not a diagram —
 * it reads as "connected system" without asking to be decoded, so it sits
 * beside the headline instead of competing with it.
 */
export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  // Each ring turns at its own pace so the composition never repeats a beat.
  const spin = (duration: number, reverse = false) =>
    reduceMotion
      ? {}
      : {
          animate: { rotate: reverse ? -360 : 360 },
          transition: { duration, repeat: Infinity, ease: "linear" as const },
        };

  const origin = { transformOrigin: "200px 200px" } as const;

  return (
    <svg
      viewBox="0 0 400 400"
      role="presentation"
      aria-hidden="true"
      className="h-auto w-full max-w-[440px]"
    >
      <defs>
        <radialGradient id="hv-glow">
          <stop offset="0%" stopColor="#c08040" stopOpacity="0.40" />
          <stop offset="55%" stopColor="#c08040" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#c08040" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hv-core" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d19a5f" />
          <stop offset="100%" stopColor="#8a5024" />
        </linearGradient>
      </defs>

      {/* Ambient bloom behind the whole composition */}
      <circle cx="200" cy="200" r="190" fill="url(#hv-glow)" />

      {/* Static orbit grooves */}
      <circle cx="200" cy="200" r="76" fill="none" stroke="#443b33" />
      <circle
        cx="200"
        cy="200"
        r="124"
        fill="none"
        stroke="#443b33"
        strokeDasharray="3 7"
      />
      <circle
        cx="200"
        cy="200"
        r="172"
        fill="none"
        stroke="#443b33"
        opacity="0.7"
      />

      {/* Copper sweeps — a dash long enough to read as an arc, chasing the
          groove it sits on. */}
      <motion.circle
        cx="200"
        cy="200"
        r="124"
        fill="none"
        stroke="#c08040"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="105 674"
        style={origin}
        {...spin(18)}
      />
      <motion.circle
        cx="200"
        cy="200"
        r="172"
        fill="none"
        stroke="#c08040"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="70 1011"
        opacity="0.6"
        style={origin}
        {...spin(28, true)}
      />

      {/* Orbiting nodes */}
      <motion.g style={origin} {...spin(24)}>
        {ORBIT_NODES.inner.map(([x, y]) => (
          <rect
            key={`i-${x}-${y}`}
            x={x - 3}
            y={y - 3}
            width="6"
            height="6"
            rx="1"
            fill="#c08040"
          />
        ))}
      </motion.g>

      <motion.g style={origin} {...spin(34, true)}>
        {ORBIT_NODES.mid.map(([x, y]) => (
          <rect
            key={`m-${x}-${y}`}
            x={x - 3}
            y={y - 3}
            width="6"
            height="6"
            rx="1"
            fill="#f4f1ea"
            opacity="0.38"
          />
        ))}
      </motion.g>

      <motion.g style={origin} {...spin(46)}>
        {ORBIT_NODES.outer.map(([x, y]) => (
          <rect
            key={`o-${x}-${y}`}
            x={x - 2.5}
            y={y - 2.5}
            width="5"
            height="5"
            rx="1"
            fill="#f4f1ea"
            opacity="0.18"
          />
        ))}
      </motion.g>

      {/* Core: the brand's grid mark, sat in a raised well */}
      <circle
        cx="200"
        cy="200"
        r="34"
        fill="#1c1916"
        stroke="#2a2521"
        strokeWidth="1.5"
      />
      <rect x="188" y="188" width="10" height="10" rx="1.5" fill="url(#hv-core)" />
      <rect
        x="202"
        y="188"
        width="10"
        height="10"
        rx="1.5"
        fill="#f4f1ea"
        opacity="0.22"
      />
      <rect
        x="188"
        y="202"
        width="10"
        height="10"
        rx="1.5"
        fill="#f4f1ea"
        opacity="0.22"
      />
      <rect
        x="202"
        y="202"
        width="10"
        height="10"
        rx="1.5"
        fill="#f4f1ea"
        opacity="0.22"
      />
    </svg>
  );
}
