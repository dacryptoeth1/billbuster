import Link from "next/link";
import { PenCircle } from "@/components/marks/PenCircle";

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
          <span className="relative mr-0.5 inline-block px-1.5">
            Bill
            <PenCircle className="-inset-x-1 -inset-y-1" animate={false} />
          </span>
          Buster
        </Link>
        <span className="text-sm text-ink-soft">Your files are never stored</span>
      </div>
    </header>
  );
}
