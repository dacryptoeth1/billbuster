/** Hero mark: a first aid box that gently bobs while its cross pulses. */
export function FirstAidBox({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden className={className}>
      <ellipse
        className="med-box-shadow"
        cx={40}
        cy={73}
        rx={24}
        ry={3}
        fill="var(--color-ink)"
        opacity={0.12}
      />
      <g className="med-box">
        <path
          d="M29 24v-6a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v6"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={3.5}
        />
        <rect
          x={10}
          y={24}
          width={60}
          height={42}
          rx={8}
          fill="var(--color-paper)"
          stroke="var(--color-ink)"
          strokeWidth={3.5}
        />
        <path
          className="med-cross"
          d="M35.5 33h9v8.5H53v9h-8.5V59h-9v-8.5H27v-9h8.5z"
          fill="var(--color-pen)"
        />
      </g>
    </svg>
  );
}
