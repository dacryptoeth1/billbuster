import { ListeningHeartbeat } from "@/components/medical/ListeningHeartbeat";

export type Preview = { file: File; url: string };

export function FilePreview({
  preview: { file, url },
  listening,
}: {
  preview: Preview;
  listening?: boolean;
}) {
  return (
    <div className="paper relative overflow-hidden rounded-2xl">
      <div className="border-b border-rule px-4 py-2 text-sm text-ink-soft">
        <span className="font-medium text-ink">{file.name}</span> · {(file.size / 1024).toFixed(0)} KB
      </div>
      {file.type === "application/pdf" ? (
        <iframe src={url} title="Bill preview" className="h-[28rem] w-full" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- local blob URL, nothing to optimize
        <img src={url} alt="Bill preview" className="max-h-[28rem] w-full object-contain" />
      )}
      {listening && (
        <span className="paper absolute bottom-3 left-1/2 flex -translate-x-1/2 rounded-xl px-3 py-2 text-ink">
          <ListeningHeartbeat className="h-10 w-30" />
        </span>
      )}
    </div>
  );
}
