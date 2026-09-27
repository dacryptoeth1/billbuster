import type { CSSProperties } from "react";

type Props = {
  /** Position it over the parent (which must be `relative`), e.g. "-inset-2". */
  className?: string;
  /** Milliseconds before the pen starts drawing. */
  delay?: number;
  animate?: boolean;
};

/** A loose, hand-drawn red loop that overshoots its start, like circling something on paper. */
export function PenCircle({ className = "", delay = 0, animate = true }: Props) {
  // The span does the positioning: an absolutely positioned <svg> won't stretch to its insets.
  return (
    <span aria-hidden className={`pointer-events-none absolute ${className}`}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="size-full overflow-visible">
        <path
          d="M88 7C70 -1 20 1 7 13C-3 25 17 38 52 37C87 36 99 26 94 14C91 6 76 2 60 4"
          pathLength={1}
          fill="none"
          stroke="var(--color-pen)"
          strokeWidth={2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className={animate ? "pen-stroke" : undefined}
          style={{ "--len": 1, "--pen-delay": `${delay}ms` } as CSSProperties}
        />
      </svg>
    </span>
  );
}
