import { UploadFlow } from "@/components/upload/UploadFlow";
import { PenCircle } from "@/components/marks/PenCircle";

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl">
      <section className="mb-10 text-center sm:mb-12">
        <h1 className="font-display text-4xl leading-[1.15] font-extrabold tracking-tight text-balance sm:text-6xl">
          Your medical bill has{" "}
          <span className="whitespace-nowrap">
            <span className="relative inline-block text-pen">
              mistakes
              <PenCircle className="-inset-x-3 -inset-y-1 sm:-inset-x-4 sm:-inset-y-1.5" delay={350} />
            </span>
            .
          </span>{" "}
          Let&apos;s find them.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-lg text-ink-soft text-pretty">
          Upload a bill and we&apos;ll mark it up like a friend with a red pen: flag the errors, explain every
          charge in plain English, and write the dispute letter for you.
        </p>
      </section>
      <UploadFlow />
    </div>
  );
}
