import type { Bill, Flag } from "@/lib/schema";
import { formatUsd } from "@/lib/money";
import { Receipt } from "@/components/Receipt";
import { PenCircle } from "@/components/marks/PenCircle";
import { PenStrike } from "@/components/marks/PenStrike";
import type { MarkSchedule } from "./choreography";
import { PenNotes } from "./PenNotes";

type Props = {
  bill: Bill;
  flags: Flag[];
  schedule: MarkSchedule;
  /** `undefined` while loading; empty strings for items without an explanation. */
  explanations?: string[];
};

/** The bill as a paper receipt, marked up in red pen. */
export function BillReceipt({ bill, flags, schedule, explanations }: Props) {
  const billLevelFlags = flags.filter((f) => f.lineIndex === null);

  return (
    <Receipt>
      <header className="border-b-2 border-dashed border-rule px-5 pt-5 pb-4 text-center sm:px-8">
        <p className="font-display text-xl font-bold">{bill.provider || "Your provider"}</p>
        <p className="mt-1 font-mono text-xs text-ink-soft">
          {[bill.patientRef && `Acct ${bill.patientRef}`, bill.dateOfService].filter(Boolean).join(" · ")}
        </p>
      </header>

      <ol className="px-5 sm:px-8">
        {bill.lineItems.map((item, i) => {
          const rowFlags = flags.filter((f) => f.lineIndex === i);
          const delay = schedule.lines.get(i);
          const isDuplicate = rowFlags.some((f) => f.type === "duplicate");
          return (
            <li key={i} className="border-b border-dashed border-rule py-3 last:border-b-0">
              <div className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-1">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="font-mono text-xs text-ink-soft">
                    {item.code || "no code"} · ×{item.quantity}
                  </p>
                </div>
                <span className="relative mt-0.5 font-mono font-semibold tabular-nums">
                  <span className={delay !== undefined ? "text-pen" : ""}>{formatUsd(item.charge)}</span>
                  {delay !== undefined && (
                    <>
                      <PenCircle className="-inset-x-3 -inset-y-2" delay={delay} />
                      {isDuplicate && <PenStrike delay={delay + 550} />}
                    </>
                  )}
                </span>
              </div>
              <Explanation text={explanations?.[i]} loading={!explanations} />
              {delay !== undefined && <PenNotes flags={rowFlags} delay={delay + 400} />}
            </li>
          );
        })}
      </ol>

      <footer className="mx-5 space-y-1 border-t-2 border-ink pt-3 font-mono text-sm sm:mx-8">
        <div className="flex items-center justify-between text-base font-semibold">
          <span>Total billed</span>
          <span className="relative tabular-nums">
            {formatUsd(bill.totalBilled)}
            {schedule.total !== null && (
              <PenCircle className="-inset-x-3 -inset-y-2" delay={schedule.total} />
            )}
          </span>
        </div>
        <Row label="Insurance paid" value={`−${formatUsd(bill.insurancePaid)}`} />
        <Row label="You owe" value={formatUsd(bill.patientOwes)} />
        {schedule.total !== null && (
          <div className="pt-2 font-sans">
            <PenNotes flags={billLevelFlags} delay={schedule.total + 400} />
          </div>
        )}
      </footer>
    </Receipt>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-soft">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function Explanation({ text, loading }: { text?: string; loading: boolean }) {
  if (loading) {
    return <span aria-hidden className="mt-1.5 block h-4 w-2/3 animate-pulse rounded bg-highlight/40" />;
  }
  if (!text) return null;
  return (
    <p className="mt-1.5 text-sm leading-relaxed">
      <span className="highlighter">{text}</span>
    </p>
  );
}
