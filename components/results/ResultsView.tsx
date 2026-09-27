"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { analyzeBill } from "@/lib/flags";
import { explainItems, useStoredBill } from "@/lib/client";
import type { Bill } from "@/lib/schema";
import { BillReceipt } from "./BillReceipt";
import { MoneyBack } from "./MoneyBack";
import { LetterPanel } from "./LetterPanel";
import { scheduleMarks } from "./choreography";

export function ResultsView() {
  const bill = useStoredBill();

  if (bill === undefined) return null;
  if (bill === null) {
    return (
      <div className="text-center">
        <p className="text-ink-soft">No bill to show yet.</p>
        <Link href="/" className="mt-4 inline-block font-semibold underline underline-offset-4">
          ← Upload a bill
        </Link>
      </div>
    );
  }
  return <Results bill={bill} />;
}

function Results({ bill }: { bill: Bill }) {
  const { flags, questionableTotal } = useMemo(() => analyzeBill(bill), [bill]);
  const schedule = useMemo(() => scheduleMarks(flags), [flags]);
  const explanations = useExplanations(bill);
  const firstMark = Math.min(...schedule.lines.values(), schedule.total ?? Infinity);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm font-semibold underline-offset-4 hover:underline">
        ← Check another bill
      </Link>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="lg:sticky lg:top-6 lg:order-2">
          <MoneyBack
            total={questionableTotal}
            flagCount={flags.length}
            startsAt={Number.isFinite(firstMark) ? firstMark : 0}
            endsAt={schedule.endsAt}
          />
        </div>
        <div className="lg:order-1">
          <BillReceipt bill={bill} flags={flags} schedule={schedule} explanations={explanations} />
          <p className="mt-3 text-xs text-ink-soft">
            <span className="highlighter">Highlighted</span> notes explain each charge in plain English.
          </p>
        </div>
      </div>
      {flags.length > 0 && <LetterPanel bill={bill} />}
    </div>
  );
}

/** Plain-English explanations load after the page renders; failures just hide them. */
function useExplanations(bill: Bill) {
  const [explanations, setExplanations] = useState<string[]>();

  useEffect(() => {
    let cancelled = false;
    explainItems(bill.lineItems)
      .catch(() => bill.lineItems.map(() => ""))
      .then((result) => !cancelled && setExplanations(result));
    return () => {
      cancelled = true;
    };
  }, [bill]);

  return explanations;
}
