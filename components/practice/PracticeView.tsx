"use client";

import { useMemo } from "react";
import Link from "next/link";
import { analyzeBill } from "@/lib/flags";
import { useStoredBill } from "@/lib/client";
import { buildDynamicVariables, buildTalkingPoints } from "@/lib/practice";
import { formatUsd } from "@/lib/money";
import type { Bill } from "@/lib/schema";
import { TalkingPoints } from "./TalkingPoints";
import { CallPanel } from "./CallPanel";

export function PracticeView() {
  const bill = useStoredBill();

  if (bill === undefined) return null;
  if (bill === null) {
    return (
      <div className="text-center">
        <p className="text-ink-soft">Check a bill first, then practice the call.</p>
        <Link href="/" className="mt-4 inline-block font-semibold underline underline-offset-4">
          ← Upload a bill
        </Link>
      </div>
    );
  }
  return <Practice bill={bill} />;
}

function Practice({ bill }: { bill: Bill }) {
  const analysis = useMemo(() => analyzeBill(bill), [bill]);
  const points = useMemo(() => buildTalkingPoints(bill, analysis.flags), [bill, analysis]);
  const dynamicVariables = useMemo(() => buildDynamicVariables(bill, analysis), [bill, analysis]);

  return (
    <div className="space-y-6">
      <Link href="/results" className="text-sm font-semibold underline-offset-4 hover:underline">
        ← Back to results
      </Link>
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Practice the call</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Rehearse with Pat, a billing rep at {bill.provider || "your provider"}, before you call for real.
          You&apos;re disputing about{" "}
          <span className="font-semibold text-money">{formatUsd(analysis.questionableTotal)}</span>.
        </p>
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        <CallPanel dynamicVariables={dynamicVariables} />
        <TalkingPoints points={points} />
      </div>
      <p className="text-center text-xs text-ink-soft">
        Pat is an AI role-play for practice only. Nothing you say is sent to your provider.
      </p>
    </div>
  );
}
