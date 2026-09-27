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
        <p className="text-slate-600">Check a bill first, then practice the call.</p>
        <Link href="/" className="mt-4 inline-block font-medium text-emerald-700 hover:underline">
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
      <Link href="/results" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Back to results
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Practice the call</h1>
        <p className="mt-1 text-slate-600">
          Rehearse with Pat, a billing rep at {bill.provider || "your provider"}, before you call for real.
          You&apos;re disputing about{" "}
          <span className="font-medium text-slate-900">{formatUsd(analysis.questionableTotal)}</span>.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <CallPanel dynamicVariables={dynamicVariables} />
        <TalkingPoints points={points} />
      </div>
      <p className="text-center text-xs text-slate-500">
        Pat is an AI role-play for practice only. Nothing you say is sent to your provider.
      </p>
    </div>
  );
}
