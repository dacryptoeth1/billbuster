import type { Bill } from "@/lib/schema";
import { formatUsd } from "@/lib/money";

type Props = { bill: Bill; questionableTotal: number; flagCount: number };

export function SummaryCard({ bill, questionableTotal, flagCount }: Props) {
  const clean = flagCount === 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className={`px-6 py-8 text-center ${clean ? "bg-emerald-50" : "bg-red-50"}`}>
        <p className={`text-sm font-medium ${clean ? "text-emerald-800" : "text-red-800"}`}>
          {clean ? "No likely errors found" : "Questionable charges"}
        </p>
        <p
          className={`mt-1 text-5xl font-semibold tracking-tight tabular-nums ${clean ? "text-emerald-700" : "text-red-700"}`}
        >
          {formatUsd(questionableTotal)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {clean
            ? "Everything we checked looks consistent. Still review it against your insurer's statement."
            : `${flagCount} issue${flagCount === 1 ? "" : "s"} found · estimates, not guarantees`}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-slate-200 text-sm sm:grid-cols-4">
        <Stat label="Provider" value={bill.provider || "—"} />
        <Stat label="Date of service" value={bill.dateOfService || "—"} />
        <Stat label="Total billed" value={formatUsd(bill.totalBilled)} />
        <Stat label="You owe" value={formatUsd(bill.patientOwes)} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
