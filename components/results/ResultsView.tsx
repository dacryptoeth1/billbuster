"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { analyzeBill } from "@/lib/flags";
import { explainItems, useStoredBill } from "@/lib/client";
import type { Bill } from "@/lib/schema";
import { SummaryCard } from "./SummaryCard";
import { LineItemTable } from "./LineItemTable";
import { LetterPanel } from "./LetterPanel";

export function ResultsView() {
  const bill = useStoredBill();

  if (bill === undefined) return null;
  if (bill === null) {
    return (
      <div className="text-center">
        <p className="text-slate-600">No bill to show yet.</p>
        <Link href="/" className="mt-4 inline-block font-medium text-emerald-700 hover:underline">
          ← Upload a bill
        </Link>
      </div>
    );
  }
  return <Results bill={bill} />;
}

function Results({ bill }: { bill: Bill }) {
  const { flags, questionableTotal } = useMemo(() => analyzeBill(bill), [bill]);
  const explanations = useExplanations(bill);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Check another bill
      </Link>
      <SummaryCard bill={bill} questionableTotal={questionableTotal} flagCount={flags.length} />
      <LineItemTable bill={bill} flags={flags} explanations={explanations} />
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
