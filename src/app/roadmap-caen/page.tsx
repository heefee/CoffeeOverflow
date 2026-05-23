import { SiteHeader } from "@/components/layout/site-header";
import { RoadmapCaenPageClient } from "@/components/roadmap/roadmap-caen-page-client";

export default function RoadmapCaenPage() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <RoadmapCaenPageClient />
      </main>
    </div>
  );
}
