import type { Metadata } from "next";
import { PracticeView } from "@/components/practice/PracticeView";

export const metadata: Metadata = { title: "Practice the call — BillBuster" };

export default function PracticePage() {
  return <PracticeView />;
}
