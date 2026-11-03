const TRACE = "M30 24h10l3-5 4 5h4l3 4 5-22 5 24 3-6h4l3-3 4 3h18";

/** A stethoscope whose chestpiece "listens" while an ECG trace sweeps out of it. Inherits text color. */
export function ListeningHeartbeat({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 32" aria-hidden className={className} fill="none" strokeLinecap="round">
      <path
        d="M4 3v8a8 8 0 0 0 16 0V3M12 19v2a3 3 0 0 0 3 3h6"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <circle className="med-chestpiece" cx={25} cy={24} r={4.5} fill="var(--color-pen)" />
      <path d={TRACE} stroke="currentColor" strokeOpacity={0.25} strokeWidth={2} strokeLinejoin="round" />
      <path
        className="med-trace"
        d={TRACE}
        pathLength={1}
        stroke="var(--color-pen)"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}
