import type { TalkingPoint } from "@/lib/practice";
import { formatUsd } from "@/lib/money";

// Each note sits a little crooked, like it was slapped onto the desk.
const TILTS = ["-rotate-1", "rotate-1", "-rotate-[0.5deg]", "rotate-[1.5deg]"];

export function TalkingPoints({ points }: { points: TalkingPoint[] }) {
  return (
    <aside>
      <h2 className="font-display text-xl font-bold">Your talking points</h2>
      <p className="mt-1 text-sm text-ink-soft">Stay calm and specific. Name the line and the problem.</p>
      <ol className="mt-5 space-y-5">
        {points.map((point, i) => (
          <li
            key={i}
            className={`bg-highlight px-4 pt-3 pb-4 shadow-[0_8px_16px_-6px_rgb(21_33_59/0.3)] ${TILTS[i % TILTS.length]}`}
          >
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold">{point.title}</span>
              {point.amount > 0 && (
                <span className="shrink-0 font-mono font-semibold text-[#9b1c13] tabular-nums">
                  ~{formatUsd(point.amount)}
                </span>
              )}
            </div>
            <p className="mt-2 text-[15px] leading-snug">&ldquo;{point.say}&rdquo;</p>
          </li>
        ))}
        <li className="rotate-[0.5deg] bg-paper px-4 pt-3 pb-4 text-sm shadow-[0_8px_16px_-6px_rgb(21_33_59/0.25)]">
          <span className="font-semibold">Close with:</span> &ldquo;Can you send me an itemized bill and hold
          my account while this is reviewed?&rdquo;
        </li>
      </ol>
    </aside>
  );
}
