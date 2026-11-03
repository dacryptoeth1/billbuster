import type { Metadata } from "next";
import { PaymentReturnView } from "@/components/payment/PaymentReturnView";

export const metadata: Metadata = { title: "Test payment — BillBuster" };

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { cancelled } = await searchParams;
  return <PaymentReturnView cancelled={cancelled !== undefined} />;
}
