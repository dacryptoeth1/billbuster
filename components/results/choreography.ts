import type { Flag } from "@/lib/schema";

/** Pause before the pen starts, so the receipt is seen clean first. */
const START_MS = 700;
/** Time between one mark and the next. */
const STEP_MS = 750;

export type MarkSchedule = {
  /** lineIndex → ms delay before that line gets marked. */
  lines: Map<number, number>;
  /** Delay for circling the bill total (math errors), or null if unflagged. */
  total: number | null;
  /** When the last mark finishes; the money counter lands here. */
  endsAt: number;
};

/** Marks go top to bottom like a person reading the bill, bill-level issues last. */
export function scheduleMarks(flags: Flag[]): MarkSchedule {
  const lineIndexes = [...new Set(flags.flatMap((f) => (f.lineIndex === null ? [] : [f.lineIndex])))].sort(
    (a, b) => a - b,
  );
  const lines = new Map(lineIndexes.map((index, i) => [index, START_MS + i * STEP_MS]));
  const hasBillLevel = flags.some((f) => f.lineIndex === null);
  const total = hasBillLevel ? START_MS + lineIndexes.length * STEP_MS : null;
  const marks = lineIndexes.length + (hasBillLevel ? 1 : 0);
  return { lines, total, endsAt: START_MS + Math.max(marks, 1) * STEP_MS };
}
