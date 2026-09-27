import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            B
          </span>
          BillBuster
        </Link>
        <span className="text-sm text-slate-500">Your files are never stored</span>
      </div>
    </header>
  );
}
