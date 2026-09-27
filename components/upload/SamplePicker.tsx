"use client";

import { SAMPLE_BILLS, type SampleBill } from "@/lib/samples";

type Props = { onPick: (sample: SampleBill) => void; disabled?: boolean };

export function SamplePicker({ onPick, disabled }: Props) {
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
            className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-500 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="block font-medium">{sample.title}</span>
            <span className="mt-1 block text-sm text-slate-500">{sample.blurb}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
