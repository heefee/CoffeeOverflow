import { SiteHeader } from "@/components/layout/site-header";
import { RoadmapCaenPageClient } from "@/components/roadmap/roadmap-caen-page-client";

export default async function RoadmapCaenPage({
  searchParams,
}: {
  searchParams: Promise<{ cf?: string; caen?: string }>;
}) {
  const { cf, caen } = await searchParams;

  return (
    <div className="flex min-h-full flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <RoadmapCaenPageClient initialCf={cf} initialCaen={caen} />
      </main>
    </div>
  );
}
