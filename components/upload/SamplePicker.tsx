"use client";

import { SAMPLE_BILLS, type SampleBill } from "@/lib/samples";
import { ReadingLabel } from "./ReadingLabel";

type Props = {
  onPick: (sample: SampleBill) => void;
  disabled?: boolean;
  /** The sample currently being read, if any. */
  activeId?: string;
};

export function SamplePicker({ onPick, disabled, activeId }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-slate-600">No bill handy? Try a sample (fake data):</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {SAMPLE_BILLS.map((sample) => (
          <button
            key={sample.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(sample)}
            className={`rounded-xl border bg-white p-4 text-left transition hover:border-emerald-500 hover:shadow-sm disabled:cursor-not-allowed ${
              activeId === sample.id ? "border-emerald-500" : "border-slate-200 disabled:opacity-60"
            }`}
          >
            <span className="block font-medium">{sample.title}</span>
            <span className="mt-1 block text-sm text-slate-500">
              {activeId === sample.id ? (
                <span className="text-emerald-700">
                  <ReadingLabel />
                </span>
              ) : (
                sample.blurb
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
