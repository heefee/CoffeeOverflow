"use client";

import dynamic from "next/dynamic";
import { PropertyPanel } from "@/components/property-panel/property-panel";

const CadastruMap = dynamic(
  () => import("@/components/map/cadastru-map").then((m) => m.CadastruMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">
        Se încarcă harta...
      </div>
    ),
  },
);

export function MapPageClient() {
  return (
    <div className="flex h-full min-h-0 w-full flex-row overflow-hidden">
      <div className="relative min-h-0 min-w-0 flex-1">
        <CadastruMap />
      </div>
      <aside className="flex h-full w-[min(42vw,420px)] min-w-[300px] shrink-0 flex-col border-l border-border bg-card shadow-lg">
        <div className="shrink-0 border-b border-border bg-secondary/60 px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Detalii imobil
          </p>
        </div>
        <div className="min-h-0 flex-1">
          <PropertyPanel />
        </div>
      </aside>
    </div>
  );
}
