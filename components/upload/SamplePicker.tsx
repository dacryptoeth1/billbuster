"use client";

import { SAMPLE_BILLS, type SampleBill } from "@/lib/samples";
import { formatUsd } from "@/lib/money";
import { ReadingLabel } from "./ReadingLabel";
import { Receipt } from "@/components/Receipt";

type Props = {
  onPick: (sample: SampleBill) => void;
  disabled?: boolean;
  /** The sample currently being read, if any. */
  activeId?: string;
};

// Alternate tilt directions so the row looks like receipts tossed on a desk.
const TILTS = ["hover:-rotate-2", "hover:rotate-2", "hover:-rotate-1"];

export function SamplePicker({ onPick, disabled, activeId }: Props) {
  return (
    <section>
      <h2 className="mb-4 font-display text-xl font-bold">No bill handy? Grab a sample.</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {SAMPLE_BILLS.map((sample, i) => (
          <button
            key={sample.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(sample)}
            className={`group text-left transition duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:cursor-not-allowed ${
              TILTS[i % TILTS.length]
            } ${activeId === sample.id ? "-translate-y-1" : "disabled:opacity-60"}`}
          >
            <Receipt as="span" className="h-full">
              <span className="block px-4 pt-4">
                <span className="block font-mono text-xs text-ink-soft">{sample.bill.provider}</span>
                <span className="mt-1 block font-display text-lg font-bold">{sample.title}</span>
                <span className="mt-2 block border-t border-dashed border-rule pt-2 text-sm text-ink-soft">
                  {activeId === sample.id ? <ReadingLabel /> : sample.blurb}
                </span>
                <span className="mt-2 flex justify-between font-mono text-sm">
                  <span>Amount due</span>
                  <span className="font-semibold">{formatUsd(sample.bill.patientOwes)}</span>
                </span>
              </span>
            </Receipt>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-soft">All samples are made up. No real patient data.</p>
    </section>
  );
}
