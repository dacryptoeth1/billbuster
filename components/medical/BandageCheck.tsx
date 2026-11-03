"use client";

import { useEffect, useRef, useState } from "react";

const DOTS = [7.5, 11, 37, 40.5].flatMap((cx) => [9.5, 14.5].map((cy) => ({ cx, cy })));

/** A bandage with a check on its pad, which sticks on the first time it scrolls into view. */
export function BandageCheck({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 48 24"
      width={48}
      height={24}
      aria-hidden
      className={`med-bandage ${seen ? "med-seen" : ""} ${className}`}
    >
      <g transform="rotate(-6 24 12)">
        <rect x={2} y={4} width={44} height={16} rx={8} fill="#f4d5b3" stroke="#c99a6b" strokeWidth={1.25} />
        <rect x={15} y={5.5} width={18} height={13} rx={2.5} fill="var(--color-paper)" />
        {DOTS.map(({ cx, cy }) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={0.9} fill="#c99a6b" />
        ))}
        <path
          className="med-bandage-check"
          d="M19.5 12.2l3.2 3.2 5.8-6.4"
          pathLength={1}
          fill="none"
          stroke="var(--color-money)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
