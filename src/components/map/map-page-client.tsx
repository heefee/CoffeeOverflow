"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { PropertyPanel } from "@/components/property-panel/property-panel";
import { ResizablePropertySidebar } from "@/components/map/resizable-property-sidebar";
import { useAppStore } from "@/store/app-store";

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

interface MapPageClientProps {
  initialCf?: string;
}

export function MapPageClient({ initialCf }: MapPageClientProps) {
  const { setLoadingProperty, setSelectedFeature, setSelectedProperty } = useAppStore();

  useEffect(() => {
    if (!initialCf) return;

    let ignore = false;
    setLoadingProperty(true);
    setSelectedFeature(null);

    fetch(`/api/properties/${encodeURIComponent(initialCf)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((property) => {
        if (!ignore) setSelectedProperty(property);
      })
      .catch(() => {
        if (!ignore) setSelectedProperty(null);
      })
      .finally(() => {
        if (!ignore) setLoadingProperty(false);
      });

    return () => {
      ignore = true;
    };
  }, [initialCf, setLoadingProperty, setSelectedFeature, setSelectedProperty]);

  return (
    <div className="flex h-full min-h-0 w-full flex-row overflow-hidden">
      <div className="relative min-h-0 min-w-0 flex-1">
        <CadastruMap />
      </div>
      <ResizablePropertySidebar>
        <PropertyPanel />
      </ResizablePropertySidebar>
    </div>
  );
}
