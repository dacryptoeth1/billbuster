import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Use "span" inside buttons and other phrasing-only contexts. */
  as?: "div" | "span";
};

/**
 * A paper slip with a torn zig-zag bottom. The shadow lives on the wrapper as a
 * filter because the torn-edge mask would clip a normal box-shadow.
 */
export function Receipt({ children, className = "", as: Tag = "div" }: Props) {
  return (
    <Tag className={`block drop-shadow-[0_6px_14px_rgb(21_33_59/0.14)] ${className}`}>
      <Tag className="receipt-edge block h-full rounded-t-lg bg-paper">{children}</Tag>
    </Tag>
  );
}
