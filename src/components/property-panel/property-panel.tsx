"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import type {
  CadastralImobilePart,
  CertificateStatus,
  ComplianceTask,
  PropertyRecord,
} from "@/types";
import {
  Building2,
  ExternalLink,
  FileText,
  Landmark,
  Loader2,
  MapPin,
  Shield,
} from "lucide-react";
import { LegalDictionaryArea } from "@/components/dictionary/legal-dictionary-area";
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

function ImobileSection({ parts }: { parts: CadastralImobilePart[] }) {
  const land = parts.find((p) => p.role === "teren");
  const building = parts.find((p) => p.role === "constructie");

  return (
    <Card className="border-primary/20 bg-secondary/40">
      <CardContent className="space-y-3 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Imobile în carte funciară
        </p>
        {land ? (
          <div className="rounded-lg border border-border bg-background/80 p-3 text-sm">
            <p className="font-medium text-foreground">Teren</p>
            <DetailRow label="Nr. cadastral" value={land.cadastralNumber} />
            <DetailRow label="Carte funciară" value={land.carteFunciara} />
            {land.areaSqm ? (
              <DetailRow label="Suprafață" value={`${land.areaSqm} m²`} />
            ) : null}
            <DetailRow label="Folosință" value={land.usage} />
          </div>
        ) : null}
        {building ? (
          <div className="rounded-lg border border-border bg-background/80 p-3 text-sm">
            <p className="font-medium text-foreground">
              Construcție{building.buildingLabel ? ` (${building.buildingLabel})` : ""}
            </p>
            <DetailRow label="Nr. cadastral" value={building.cadastralNumber} />
            <DetailRow label="Carte funciară" value={building.carteFunciara} />
            {building.areaSqm ? (
              <DetailRow label="Suprafață construită" value={`${building.areaSqm} m²`} />
            ) : null}
            <DetailRow label="Folosință" value={building.usage} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ComplianceChecklist({
  propertyRef,
  tasks,
}: {
  propertyRef: string;
  tasks: ComplianceTask[];
}) {
  const storageKey = `compliance:${propertyRef}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const defaults = Object.fromEntries(
      tasks.map((task) => [task.id, Boolean(task.defaultCompleted)]),
    );

    try {
      const stored = window.localStorage.getItem(storageKey);
      setChecked(stored ? { ...defaults, ...JSON.parse(stored) } : defaults);
    } catch {
      setChecked(defaults);
    }
  }, [storageKey, tasks]);

  function toggleTask(taskId: string) {
    setChecked((current) => {
      const next = { ...current, [taskId]: !current[taskId] };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Local persistence is optional; the checkbox still works for this session.
      }
      return next;
    });
  }

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Verificări periodice ISU</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => {
          const isDone = Boolean(checked[task.id]);
          return (
            <label
              key={task.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background/80 p-3 text-sm"
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggleTask(task.id)}
                className="mt-1 size-4 cursor-pointer accent-primary"
              />
              <span className="space-y-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{task.title}</span>
                  <Badge variant={isDone ? "default" : "outline"} className="text-[10px]">
                    {isDone ? "Făcut" : "Nefăcut"}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {task.dueLabel}
                  </Badge>
                </span>
                <span className="block text-xs text-foreground/70">
                  {task.frequency}
                  {task.authority ? ` · ${task.authority}` : ""}
                </span>
                <span className="block text-xs text-foreground/70">{task.notes}</span>
              </span>
            </label>
          );
        })}
      </CardContent>
    </Card>
  );
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
  const activeAuthorizationsCount = p.authorizations.existing.filter(
    (authorization) => authorization.status === "active",
  ).length;

  return (
    <ScrollArea className="h-full">
      <LegalDictionaryArea className="space-y-4 p-4 md:p-5">
        <div>
          <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wide">
            Date demonstrative
          </Badge>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Referință cadastrală
          </p>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {selectedFeature?.properties.id_localId ?? p.cadastralRef}
          </h2>
          {selectedFeature?.properties.id_localId &&
          selectedFeature.properties.id_localId !== p.cadastralRef ? (
            <p className="text-xs text-foreground/60">Ref. cadastrală {p.cadastralRef}</p>
          ) : null}
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
                  label="Suprafață teren"
                  value={`${Math.round(p.areaSqm)} m²${areaFromAncpi ? ` (ANCPI: ${Math.round(areaFromAncpi)} m²)` : ""}`}
                />
                {p.immobile?.find((i) => i.role === "constructie") ? (
                  <DetailRow
                    label="Construcție"
                    value={`${p.immobile.find((i) => i.role === "constructie")!.cadastralNumber}${
                      p.immobile.find((i) => i.role === "constructie")!.areaSqm
                        ? ` · ${p.immobile.find((i) => i.role === "constructie")!.areaSqm} m²`
                        : ""
                    }`}
                  />
                ) : null}
                <DetailRow label="Zonare PUG" value={p.pugZone} />
                <DetailRow label="Nr. cadastral" value={p.cadastre.localCadastralNumber} />
                <DetailRow label="Carte funciară (teren)" value={p.landBook.number} />
                <DetailRow label="Certificat urbanism" value={cu.text} />
                <DetailRow
                  label="Autorizații active"
                  value={String(activeAuthorizationsCount)}
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
            {p.immobile?.length ? <ImobileSection parts={p.immobile} /> : null}
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
            {p.immobile?.length ? <ImobileSection parts={p.immobile} /> : null}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-primary" />
                  Carte funciară
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DetailRow label="CF teren" value={p.landBook.number} />
                {p.immobile?.find((i) => i.role === "constructie") ? (
                  <DetailRow
                    label="Imobil construcție"
                    value={p.immobile.find((i) => i.role === "constructie")!.cadastralNumber}
                  />
                ) : null}
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
                {p.urbanism.topographicNumber ? (
                  <DetailRow label="Nr. topografic" value={p.urbanism.topographicNumber} />
                ) : null}
                {p.urbanism.cadastralNumbers?.length ? (
                  <DetailRow
                    label="Nr. cadastral"
                    value={p.urbanism.cadastralNumbers.join(", ")}
                  />
                ) : null}
                <DetailRow label="Zonă PUG" value={p.urbanism.pugZone} />
                {p.urbanism.pug ? (
                  <Card className="mt-2 border-primary/20 bg-secondary/50">
                    <CardContent className="space-y-2 pt-4">
                      <DetailRow label="Cod UTR PUG" value={p.urbanism.pug.code} />
                      <DetailRow label="Denumire zonă" value={p.urbanism.pug.label} />
                      {p.urbanism.pug.subzones?.length ? (
                        <DetailRow
                          label="Subzone"
                          value={p.urbanism.pug.subzones.join(" · ")}
                        />
                      ) : null}
                      {p.urbanism.pug.character ? (
                        <p className="text-sm text-foreground/80">{p.urbanism.pug.character}</p>
                      ) : null}
                      {p.urbanism.pug.potMax ? (
                        <DetailRow label="P.O.T. maxim" value={p.urbanism.pug.potMax} />
                      ) : null}
                      {p.urbanism.pug.cutMax ? (
                        <DetailRow label="C.U.T. maxim" value={p.urbanism.pug.cutMax} />
                      ) : null}
                      {p.urbanism.pug.heightRegime ? (
                        <DetailRow
                          label="Regim înălțime"
                          value={p.urbanism.pug.heightRegime}
                        />
                      ) : null}
                      <p className="text-sm font-medium">Reguli esențiale (PUG)</p>
                      <ul className="list-inside list-disc text-sm text-foreground/90">
                        {p.urbanism.pug.keyRules.map((rule) => (
                          <li key={rule}>{rule}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : null}
                {p.urbanism.sourceUrl ? (
                  <a
                    href={p.urbanism.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex cursor-pointer items-center gap-1 text-sm text-accent hover:underline"
                  >
                    Certificat publicat — Primăria Cluj-Napoca
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
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
                  Autorizații și avize existente
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
                          variant={
                            a.status === "expired"
                              ? "destructive"
                              : a.status === "possible"
                                ? "outline"
                                : "default"
                          }
                          className="shrink-0 text-[10px]"
                        >
                          {a.status === "expired"
                            ? "Expirat"
                            : a.status === "possible"
                              ? "Posibil"
                              : "Activ"}
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
            {p.complianceTasks?.length ? (
              <ComplianceChecklist propertyRef={p.cadastralRef} tasks={p.complianceTasks} />
            ) : null}
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
      </LegalDictionaryArea>
    </ScrollArea>
  );
}
