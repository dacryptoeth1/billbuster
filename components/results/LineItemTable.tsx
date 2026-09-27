import type { Bill, Flag } from "@/lib/schema";
import { formatUsd } from "@/lib/money";
import { FlagReasons } from "./FlagReasons";

type Props = {
  bill: Bill;
  flags: Flag[];
  /** `undefined` while loading; empty strings for items without an explanation. */
  explanations?: string[];
};

export function LineItemTable({ bill, flags, explanations }: Props) {
  const billLevelFlags = flags.filter((f) => f.lineIndex === null);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="hidden grid-cols-[6rem_1fr_4rem_7rem] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium tracking-wide text-slate-500 uppercase sm:grid">
        <span>Code</span>
        <span>Service</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Charge</span>
      </div>

      <ol className="divide-y divide-slate-200">
        {bill.lineItems.map((item, i) => {
          const rowFlags = flags.filter((f) => f.lineIndex === i);
          const flagged = rowFlags.length > 0;
          return (
            <li
              key={i}
              className={`py-3 pr-4 ${flagged ? "border-l-4 border-l-red-500 bg-red-50 pl-3" : "pl-4"}`}
            >
              <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 sm:grid-cols-[6rem_1fr_4rem_7rem]">
                <span className="font-mono text-sm text-slate-500">
                  {item.code || "—"}
                  <span className="sm:hidden"> · ×{item.quantity}</span>
                </span>
                <span className="order-first col-span-2 font-medium sm:order-none sm:col-span-1">
                  {item.description}
                  <Explanation text={explanations?.[i]} loading={!explanations} />
                </span>
                <span className="hidden text-right sm:block">×{item.quantity}</span>
                <span className={`text-right font-medium tabular-nums ${flagged ? "text-red-700" : ""}`}>
                  {formatUsd(item.charge)}
                </span>
              </div>
              {flagged && (
                <div className="mt-2 sm:ml-28">
                  <FlagReasons flags={rowFlags} />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 font-medium">
        <span>Total billed</span>
        <span className="tabular-nums">{formatUsd(bill.totalBilled)}</span>
      </div>
      {billLevelFlags.length > 0 && (
        <div className="border-t border-l-4 border-slate-200 border-l-red-500 bg-red-50 px-4 py-3">
          <FlagReasons flags={billLevelFlags} />
        </div>
      )}
    </section>
  );
}

function Explanation({ text, loading }: { text?: string; loading: boolean }) {
  if (loading) return <span className="mt-1 block h-4 w-3/4 animate-pulse rounded bg-slate-200" />;
  if (!text) return null;
  return <span className="mt-0.5 block text-sm font-normal text-slate-600">{text}</span>;
}
