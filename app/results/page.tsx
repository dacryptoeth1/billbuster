import type { Metadata } from "next";
import { ResultsView } from "@/components/results/ResultsView";

export const metadata: Metadata = { title: "Your results — BillBuster" };

export default function ResultsPage() {
  return <ResultsView />;
}
