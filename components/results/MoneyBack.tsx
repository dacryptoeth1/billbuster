"use client";

import { formatUsd } from "@/lib/money";
import { useCountUp } from "@/lib/motion";

type Props = {
  total: number;
  flagCount: number;
  /** Counter starts with the first pen mark and lands with the last. */
  startsAt: number;
  endsAt: number;
};

export function MoneyBack({ total, flagCount, startsAt, endsAt }: Props) {
  const shown = useCountUp(total, { delay: startsAt, duration: endsAt - startsAt });

  if (flagCount === 0) {
    return (
      <section className="paper rounded-2xl p-6">
        <p className="font-display text-2xl font-extrabold text-money">Looks clean ✓</p>
        <p className="mt-2 text-sm text-ink-soft">
          Nothing on this bill tripped our checks. Still compare it with your insurer&apos;s statement.
        </p>
      </section>
    );
  }

  return (
    <section
      className="paper rounded-2xl p-6"
      aria-label={`Money you could get back: about ${formatUsd(total)}`}
    >
      <p className="font-medium text-ink-soft">Money you could get back</p>
      <p
        aria-hidden
        className="mt-1 font-display text-5xl font-extrabold tracking-tight text-money tabular-nums sm:text-6xl"
      >
        {formatUsd(shown)}
      </p>
      <p className="mt-3 text-sm text-ink-soft">
        <span className="font-semibold text-pen">
          {flagCount} {flagCount === 1 ? "thing" : "things"} marked
        </span>{" "}
        on your bill. Estimates, not guarantees.
      </p>
    </section>
  );
}
