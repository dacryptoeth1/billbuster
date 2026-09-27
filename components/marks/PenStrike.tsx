import type { CSSProperties } from "react";

/** A slightly wobbly red line through the parent's text (parent must be `relative`). */
export function PenStrike({ delay = 0 }: { delay?: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-[-4px] top-1/2 h-2.5 -translate-y-1/2">
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="size-full overflow-visible">
        <path
          d="M1 6C25 3 55 8 99 4"
          pathLength={1}
          fill="none"
          stroke="var(--color-pen)"
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="pen-stroke"
          style={{ "--len": 1, "--pen-delay": `${delay}ms`, "--pen-duration": "300ms" } as CSSProperties}
        />
      </svg>
    </span>
  );
}
