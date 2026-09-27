import type { TalkingPoint } from "@/lib/practice";
import { formatUsd } from "@/lib/money";

export function TalkingPoints({ points }: { points: TalkingPoint[] }) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Your talking points</h2>
      <p className="mt-1 text-sm text-slate-600">Stay calm and specific. Name the line and the problem.</p>
      <ol className="mt-4 space-y-4">
        {points.map((point, i) => (
          <li key={i} className="border-l-4 border-l-red-500 pl-3">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{point.title}</span>
              {point.amount > 0 && (
                <span className="shrink-0 font-medium text-red-700 tabular-nums">
                  ~{formatUsd(point.amount)}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-700">&ldquo;{point.say}&rdquo;</p>
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
        <span className="font-medium text-slate-900">Close with:</span> &ldquo;Can you send me an itemized
        bill and hold my account while this is reviewed?&rdquo;
      </p>
    </aside>
  );
}
