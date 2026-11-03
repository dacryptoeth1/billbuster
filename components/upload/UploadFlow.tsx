"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "./Dropzone";
import { FilePreview, type Preview } from "./FilePreview";
import { SamplePicker } from "./SamplePicker";
import { ReadingLabel } from "./ReadingLabel";
import { Alert } from "@/components/Alert";
import { extractBill, readSample, saveBill, type BillSource } from "@/lib/client";
import type { SampleBill } from "@/lib/samples";
import type { Bill } from "@/lib/schema";

// On stage, a sample should fall back quickly rather than keep the audience waiting.
const SAMPLE_TIMEOUT_MS = 25_000;

type Status =
  { state: "idle" } | { state: "reading"; sampleId?: string } | { state: "error"; message: string };

export function UploadFlow() {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  function selectFile(file: File) {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview({ file, url: URL.createObjectURL(file) });
    setStatus({ state: "idle" });
  }

  function showResults(bill: Bill, source: BillSource) {
    saveBill(bill, source);
    router.push("/results");
  }

  // Every path ends in either navigation or a visible error, never silence.
  async function analyze(file: File) {
    setStatus({ state: "reading" });
    try {
      showResults(await extractBill(file), "ai");
    } catch (err) {
      setStatus({ state: "error", message: messageFrom(err) });
    }
  }

  async function pickSample(sample: SampleBill) {
    setStatus({ state: "reading", sampleId: sample.id });
    // Samples must always work on stage: readSample falls back to the known-good extraction.
    const { bill, source } = await readSample(sample, (file) => {
      selectFile(file);
      setStatus({ state: "reading", sampleId: sample.id });
      return extractBill(file, SAMPLE_TIMEOUT_MS);
    });
    try {
      showResults(bill, source);
    } catch (err) {
      setStatus({ state: "error", message: messageFrom(err) });
    }
  }

  const reading = status.state === "reading";

  return (
    <div className="space-y-8">
      <Dropzone onFile={selectFile} disabled={reading} />

      {status.state === "error" && <Alert>{status.message}</Alert>}

      {preview && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => analyze(preview.file)}
            disabled={reading}
            className="btn btn-primary w-full text-lg"
          >
            {reading ? <ReadingLabel /> : "Check my bill"}
          </button>
          {/* Button sits above the preview so its status is visible without scrolling. */}
          <FilePreview preview={preview} listening={reading} />
        </div>
      )}

      <SamplePicker
        onPick={pickSample}
        disabled={reading}
        activeId={status.state === "reading" ? status.sampleId : undefined}
      />
    </div>
  );
}

function messageFrom(err: unknown) {
  if (err instanceof DOMException && err.name === "SecurityError") {
    return "Your browser is blocking storage for this site. Try a normal (non-private) window.";
  }
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}
