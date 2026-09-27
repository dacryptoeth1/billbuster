"use client";

import { useRef, useState, type DragEvent } from "react";

export const ACCEPTED_TYPES = "application/pdf,image/png,image/jpeg,image/webp";

type Props = { onFile: (file: File) => void; disabled?: boolean };

export function Dropzone({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-white hover:border-slate-400"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <UploadIcon />
        <span className="font-medium">Drop your bill here, or click to browse</span>
        <span className="text-sm text-slate-500">PDF, PNG, JPG, or WEBP · up to 10 MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </>
  );
}

function UploadIcon() {
  return (
    <svg
      className="size-10 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}
