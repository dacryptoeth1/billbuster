export type Preview = { file: File; url: string };

export function FilePreview({ preview: { file, url } }: { preview: Preview }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-2 text-sm text-slate-600">
        <span className="font-medium text-slate-900">{file.name}</span> · {(file.size / 1024).toFixed(0)} KB
      </div>
      {file.type === "application/pdf" ? (
        <iframe src={url} title="Bill preview" className="h-[28rem] w-full" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- local blob URL, nothing to optimize
        <img src={url} alt="Bill preview" className="max-h-[28rem] w-full object-contain" />
      )}
    </div>
  );
}
