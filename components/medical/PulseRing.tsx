import type { CSSProperties } from "react";

/** A soft red outline that pulses around a flagged row. The parent must be `relative`. */
export function PulseRing({ delay = 0 }: { delay?: number }) {
  return (
    <span
      aria-hidden
      className="med-pulse-ring pointer-events-none absolute -inset-x-4 inset-y-1 rounded-lg"
      style={{ "--med-delay": `${delay}ms` } as CSSProperties}
    />
  );
}
