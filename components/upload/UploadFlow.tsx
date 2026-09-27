"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "./Dropzone";
import { FilePreview, type Preview } from "./FilePreview";
import { SamplePicker } from "./SamplePicker";
import { extractBill, saveBill } from "@/lib/client";
import type { SampleBill } from "@/lib/samples";
import type { Bill } from "@/lib/schema";

type Status = "idle" | "reading" | "error";

export function UploadFlow() {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function selectFile(file: File) {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview({ file, url: URL.createObjectURL(file) });
    setStatus("idle");
    setError("");
  }

  async function analyze(target: File, fallback?: Bill) {
    setStatus("reading");
    setError("");
    try {
      saveBill(await extractBill(target));
      router.push("/results");
    } catch (err) {
      if (fallback) {
        // Samples must always work on stage, even if the AI call fails.
        console.warn("Extraction failed; using pre-extracted sample data.", err);
        saveBill(fallback);
        router.push("/results");
        return;
      }
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function pickSample(sample: SampleBill) {
    const res = await fetch(sample.image).catch(() => null);
    if (!res?.ok) {
      saveBill(sample.bill);
      router.push("/results");
      return;
    }
    const blob = await res.blob();
    const file = new File([blob], `${sample.id}.png`, { type: "image/png" });
    selectFile(file);
    analyze(file, sample.bill);
  }

  const reading = status === "reading";

  return (
    <div className="space-y-8">
      <Dropzone onFile={selectFile} disabled={reading} />

      {preview && (
        <div className="space-y-4">
          <FilePreview preview={preview} />
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => analyze(preview.file)}
            disabled={reading}
            className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
          >
            {reading ? <ReadingLabel /> : "Check my bill"}
          </button>
        </div>
      )}

      <SamplePicker onPick={pickSample} disabled={reading} />
    </div>
  );
}

function ReadingLabel() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      Reading your bill…
    </span>
  );
}
