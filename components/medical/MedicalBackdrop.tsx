import type { CSSProperties } from "react";

type Floater = {
  kind: "plus" | "pill";
  left: string;
  top: string;
  size: number;
  /** Resting tilt, in degrees. */
  tilt: number;
  /** Seconds per drift, and how far into it the drift starts, so they never move in unison. */
  duration: number;
  offset: number;
  red?: boolean;
  /** Skipped on phones, where the content leaves little empty background. */
  wideOnly?: boolean;
};

const FLOATERS: Floater[] = [
  { kind: "plus", left: "4%", top: "14%", size: 22, tilt: 8, duration: 15, offset: 2, red: true },
  { kind: "pill", left: "91%", top: "9%", size: 30, tilt: -28, duration: 19, offset: 7 },
  { kind: "pill", left: "9%", top: "46%", size: 28, tilt: 34, duration: 21, offset: 11, wideOnly: true },
  { kind: "plus", left: "88%", top: "38%", size: 18, tilt: -12, duration: 17, offset: 5, wideOnly: true },
  { kind: "plus", left: "3%", top: "76%", size: 16, tilt: 14, duration: 18, offset: 9 },
  { kind: "pill", left: "93%", top: "68%", size: 26, tilt: 22, duration: 23, offset: 3, red: true },
  { kind: "plus", left: "16%", top: "90%", size: 20, tilt: -6, duration: 16, offset: 12, wideOnly: true },
  { kind: "plus", left: "79%", top: "88%", size: 14, tilt: 10, duration: 20, offset: 6, wideOnly: true },
];

/** Very faint plus signs and pills drifting behind the page. Fixed, so it never affects layout. */
export function MedicalBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
      {FLOATERS.map((f) => (
        <span
          key={`${f.left}-${f.top}`}
          className={`med-floater absolute ${f.red ? "text-pen" : "text-ink"} ${f.wideOnly ? "max-sm:hidden" : ""}`}
          style={
            {
              left: f.left,
              top: f.top,
              "--med-tilt": `${f.tilt}deg`,
              animationDuration: `${f.duration}s`,
              animationDelay: `-${f.offset}s`,
            } as CSSProperties
          }
        >
          {f.kind === "plus" ? <Plus size={f.size} /> : <Pill size={f.size} />}
        </span>
      ))}
    </div>
  );
}

function Plus({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className="block">
      <path d="M7.5 2h5v5.5H18v5h-5.5V18h-5v-5.5H2v-5h5.5z" />
    </svg>
  );
}

function Pill({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 16" width={size} height={size / 2} className="block">
      <rect x={1} y={1} width={30} height={14} rx={7} fill="none" stroke="currentColor" strokeWidth={2} />
      <path d="M16 1H8a7 7 0 0 0 0 14h8z" fill="currentColor" />
    </svg>
  );
}
