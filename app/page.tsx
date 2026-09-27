import { UploadFlow } from "@/components/upload/UploadFlow";

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl">
      <section className="mb-10 text-center">
        <p className="mb-3 text-sm font-medium tracking-wide text-emerald-700 uppercase">
          Medical bill checker
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Find the errors hiding in your medical bill
        </h1>
        <p className="mt-4 text-slate-600 text-pretty">
          Upload a bill or insurance statement. We flag likely mistakes, explain every charge in plain
          English, and draft a dispute letter for you.
        </p>
      </section>
      <UploadFlow />
    </div>
  );
}
