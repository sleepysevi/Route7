import { motion, useReducedMotion } from 'motion/react';

/**
 * RouteSevenIcon — the "7" mark drawn on the chat FAB.
 * Strokes trace themselves in on mount (pathLength 0 -> 1), with the
 * tail following the bar/diagonal. Color follows the FAB's icon token
 * (white on the emerald plate in dark, near-white on the ink plate in light).
 */
export default function RouteSevenIcon() {
  const prefersReducedMotion = useReducedMotion();
  const drawIn = (delay = 0) =>
    prefersReducedMotion
      ? { duration: 0 }
      : { duration: 0.6, ease: 'easeInOut', delay };

  return (
    <svg
      viewBox="0 0 100 100"
      width="50"
      height="45"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Bar + diagonal — geometry centered on the viewBox */}
      <motion.path
        d="M30 29L70 29L40 53"
        stroke="var(--chat-fab-icon)"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={drawIn()}
      />
      {/* Curved tail, drawn after the main stroke */}
      <motion.path
        d="M40 53Q40 71 56 71"
        stroke="var(--chat-fab-icon)"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={drawIn(0.55)}
      />
    </svg>
  );
}
