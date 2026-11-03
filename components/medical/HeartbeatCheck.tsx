/** Plays once: a heartbeat trace runs across the circle, then settles into a checkmark. */
export function HeartbeatCheck({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" width={64} height={64} aria-hidden className={className} fill="none">
      <circle className="med-hb-disc" cx={36} cy={36} r={33} fill="var(--color-money-soft)" />
      <path
        className="med-hb-trace"
        d="M7 38h13l4-7 5 7h3l4 6 5-27 6 30 3-9h15"
        pathLength={1}
        opacity={0}
        stroke="var(--color-money)"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="med-hb-check"
        d="M21 37l11 11 20-23"
        pathLength={1}
        stroke="var(--color-money)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
