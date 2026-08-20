import type { ReactNode } from "react";

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-copper">
      <span className="h-1 w-1 rounded-full bg-copper" />
      {children}
    </span>
  );
}
