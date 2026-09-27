export type Preview = { file: File; url: string };

export function FilePreview({ preview: { file, url } }: { preview: Preview }) {
  return (
    <div className="paper overflow-hidden rounded-2xl">
      <div className="border-b border-rule px-4 py-2 text-sm text-ink-soft">
        <span className="font-medium text-ink">{file.name}</span> · {(file.size / 1024).toFixed(0)} KB
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
