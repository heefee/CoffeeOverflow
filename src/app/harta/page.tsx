import { SiteHeader } from "@/components/layout/site-header";
import { MapPageClient } from "@/components/map/map-page-client";

export default async function HartaPage({
  searchParams,
}: {
  searchParams: Promise<{ cf?: string }>;
}) {
  const { cf } = await searchParams;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <SiteHeader />
      <div className="min-h-0 flex-1">
        <MapPageClient initialCf={cf} />
      </div>
    </div>
  );
}
