import { ListeningHeartbeat } from "@/components/medical/ListeningHeartbeat";

export function ReadingLabel() {
  return (
    <span className="inline-flex items-center gap-2">
      <ListeningHeartbeat className="h-5 w-[3.75rem] shrink-0" />
      Reading your bill…
    </span>
  );
}
