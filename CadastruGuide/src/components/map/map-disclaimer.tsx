import { DISCLAIMER_RO } from "@/lib/constants";
import { Info } from "lucide-react";

export function MapDisclaimer() {
  return (
    <div
      className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-[min(100%-2rem,22rem)] rounded-lg border border-border bg-card/95 px-3 py-2 shadow-md backdrop-blur-sm"
      role="note"
    >
      <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        {DISCLAIMER_RO}
      </p>
    </div>
  );
}
