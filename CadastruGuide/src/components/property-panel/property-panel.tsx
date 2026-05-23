"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import type { CertificateStatus, PropertyRecord } from "@/types";
import {
  Building2,
  ExternalLink,
  FileText,
  Landmark,
  Loader2,
  MapPin,
  Shield,
} from "lucide-react";
import { CaenSelector } from "@/components/roadmap/caen-selector";
import { RoadmapPanel } from "@/components/roadmap/roadmap-panel";
import { DetailRow } from "./detail-row";

function statusLabel(status: CertificateStatus) {
  switch (status) {
    case "valid":
      return { text: "Valabil", variant: "default" as const };
    case "expired":
      return { text: "Expirat", variant: "destructive" as const };
    default:
      return { text: "Lipsă", variant: "secondary" as const };
  }
}

function formatCoord(n: number) {
  return n.toFixed(5);
}

export function PropertyPanel() {
  const {
    selectedProperty,
    selectedFeature,
    loadingProperty,
    loadingParcel,
    showRoadmap,
    setShowRoadmap,
  } = useAppStore();

  if (showRoadmap) {
    return <RoadmapPanel onBack={() => setShowRoadmap(false)} />;
  }

  if (!selectedProperty && !loadingProperty && !loadingParcel) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <MapPin className="size-10 text-primary/40" aria-hidden />
        <h2 className="font-heading text-lg text-foreground">Selectați o locație</h2>
        <p className="text-sm text-foreground/70">
          Click oriunde pe hartă pentru date demo: cadastru, carte funciară, urbanism și
          autorizații.
        </p>
      </div>
    );
  }

  if (loadingProperty || loadingParcel) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span className="text-sm">Se încarcă datele imobilului...</span>
      </div>
    );
  }

  if (!selectedProperty) return null;

  const p: PropertyRecord = selectedProperty;
  const cu = statusLabel(p.urbanism.certificateStatus);
  const areaFromAncpi = selectedFeature?.properties.SHAPE_Area;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4 md:p-5">
        <div>
          <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wide">
            Date demonstrative
          </Badge>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Referință cadastrală
          </p>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {p.cadastralRef}
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-foreground/80">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            {p.address}
          </p>
        </div>

        <Tabs defaultValue="rezumat" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1 lg:grid-cols-5">
            <TabsTrigger value="rezumat" className="cursor-pointer px-1 text-[10px] sm:text-xs">
              Rezumat
            </TabsTrigger>
            <TabsTrigger value="cadastru" className="cursor-pointer px-1 text-[10px] sm:text-xs">
              Cadastru
            </TabsTrigger>
            <TabsTrigger value="cf" className="cursor-pointer px-1 text-[10px] sm:text-xs">
              Carte funciară
            </TabsTrigger>
            <TabsTrigger value="urbanism" className="cursor-pointer px-1 text-[10px] sm:text-xs">
              Urbanism
            </TabsTrigger>
            <TabsTrigger value="autorizatii" className="cursor-pointer px-1 text-[10px] sm:text-xs">
              Autorizații
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rezumat" className="mt-3 space-y-3">
            <Card className="border-border shadow-sm">
              <CardContent className="space-y-2 pt-4">
                <DetailRow
                  label="Suprafață"
                  value={`${Math.round(p.areaSqm)} m²${areaFromAncpi ? ` (ANCPI: ${Math.round(areaFromAncpi)} m²)` : ""}`}
                />
                <DetailRow label="Zonare PUG" value={p.pugZone} />
                <DetailRow label="Nr. cadastral local" value={p.cadastre.localCadastralNumber} />
                <DetailRow label="Carte funciară" value={p.landBook.number} />
                <DetailRow label="Certificat urbanism" value={cu.text} />
                <DetailRow
                  label="Autorizații active"
                  value={String(p.authorizations.existing.length)}
                />
              </CardContent>
            </Card>
            <Button
              className="w-full cursor-pointer bg-accent text-accent-foreground hover:opacity-90"
              onClick={() => setShowRoadmap(true)}
            >
              Planifică business-ul (CAEN)
            </Button>
          </TabsContent>

          <TabsContent value="cadastru" className="mt-3 space-y-3">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Landmark className="size-4 text-primary" />
                  Date cadastru (ANCPI)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DetailRow label="Ref. națională" value={p.cadastre.nationalCadastralRef} />
                <DetailRow label="Nr. cadastral" value={p.cadastre.localCadastralNumber} />
                <DetailRow label="UAT" value={p.cadastre.uat} />
                <DetailRow label="Sector" value={p.cadastre.sector} />
                <DetailRow label="Categorie teren" value={p.cadastre.landCategory} />
                <DetailRow label="Categorie folosință" value={p.cadastre.usageCategory} />
                <DetailRow
                  label="Intravilan"
                  value={p.cadastre.intravilan ? "Da" : "Nu"}
                />
                <DetailRow
                  label="Coordonate"
                  value={`${formatCoord(p.cadastre.coordinates.lat)}°N, ${formatCoord(p.cadastre.coordinates.lng)}°E`}
                />
                <DetailRow label="Înregistrat la" value={p.cadastre.registeredAt} />
                <DetailRow label="Sursă" value={p.cadastre.dataSource} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cf" className="mt-3 space-y-3">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-primary" />
                  Carte funciară
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DetailRow label="Număr CF" value={p.landBook.number} />
                <DetailRow label="Tom" value={p.landBook.volume} />
                <DetailRow label="Foaie" value={p.landBook.sheet} />
                <DetailRow label="Proprietar" value={p.landBook.ownersMasked} />
                <DetailRow label="Drept" value={p.landBook.propertyRight} />
                <DetailRow label="Ultima actualizare" value={p.landBook.lastUpdate} />
                <Separator className="my-2" />
                <p className="text-sm font-medium text-foreground/80">Sarcini</p>
                <ul className="list-inside list-disc text-sm text-foreground/90">
                  {p.landBook.encumbrances.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
                <p className="text-sm font-medium text-foreground/80">Mențiuni / notări</p>
                <ul className="list-inside list-disc text-sm text-foreground/90">
                  {p.landBook.annotations.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                <a
                  href="https://epay.ancpi.ro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm text-accent hover:underline"
                >
                  Comandă extras CF la ANCPI
                  <ExternalLink className="size-3" />
                </a>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="urbanism" className="mt-3 space-y-3">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="size-4 text-primary" />
                  Certificat de urbanism
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant={cu.variant}>{cu.text}</Badge>
                {p.urbanism.certificateNumber ? (
                  <DetailRow label="Număr CU" value={p.urbanism.certificateNumber} />
                ) : null}
                {p.urbanism.issuedAt ? (
                  <DetailRow label="Eliberat la" value={p.urbanism.issuedAt} />
                ) : null}
                {p.urbanism.validUntil ? (
                  <DetailRow label="Valabil până la" value={p.urbanism.validUntil} />
                ) : null}
                {p.urbanism.purpose ? (
                  <DetailRow label="Scop" value={p.urbanism.purpose} />
                ) : null}
                <DetailRow label="Zonă PUG" value={p.urbanism.pugZone} />
                <p className="text-sm font-medium">Restricții urbanistice</p>
                <ul className="list-inside list-disc text-sm">
                  {p.urbanism.restrictions.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <p className="text-sm font-medium">Construcții existente</p>
                <ul className="list-inside list-disc text-sm">
                  {p.urbanism.existingBuildings.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <p className="text-sm font-medium">Destinații permise (informare)</p>
                <ul className="flex flex-wrap gap-1">
                  {p.urbanism.allowedDestinations.map((d) => (
                    <Badge key={d} variant="secondary" className="text-xs">
                      {d}
                    </Badge>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="autorizatii" className="mt-3 space-y-3">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="size-4 text-primary" />
                  Autorizații și avize în vigoare
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {p.authorizations.existing.length === 0 ? (
                  <p className="text-sm text-foreground/60">
                    Nu sunt înregistrate autorizații active (demo).
                  </p>
                ) : (
                  p.authorizations.existing.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-lg border border-border bg-secondary/80 p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{a.type}</p>
                        <Badge
                          variant={a.status === "expired" ? "destructive" : "default"}
                          className="shrink-0 text-[10px]"
                        >
                          {a.status === "expired" ? "Expirat" : "Activ"}
                        </Badge>
                      </div>
                      <p className="text-foreground/70">{a.authority}</p>
                      {a.number ? (
                        <p className="text-xs text-foreground/60">Nr. {a.number}</p>
                      ) : null}
                      {a.issuedAt ? (
                        <p className="text-xs text-foreground/60">Eliberat: {a.issuedAt}</p>
                      ) : null}
                      {a.expiresAt ? (
                        <p className="mt-1 text-xs text-warning">
                          Expiră: {a.expiresAt}
                        </p>
                      ) : null}
                      {a.notes ? (
                        <p className="mt-1 text-xs text-foreground/70">{a.notes}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Autorizații posibile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {p.authorizations.possible.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-dashed border-accent/30 p-3 text-sm"
                  >
                    <Badge variant="outline" className="mb-1">
                      Posibil
                    </Badge>
                    <p className="font-medium">{a.type}</p>
                    <p className="text-foreground/70">{a.authority}</p>
                    {a.notes ? <p className="mt-1 text-xs">{a.notes}</p> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CaenSelector compact />
      </div>
    </ScrollArea>
  );
}
