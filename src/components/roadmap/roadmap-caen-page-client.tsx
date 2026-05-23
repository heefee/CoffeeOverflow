"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MapPinned,
  Search,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CaenOption, CaenRoadmap, PropertyRecord, RoadmapStep } from "@/types";

const DEMO_SPACE_REFS = [
  "424500-CF-001234",
  "424500-CF-005678",
  "424500-CF-009012",
  "424500-CF-003456",
  "424500-CF-007890",
];

type Mode = "audit" | "recommend";
type StepState = "ready" | "missing" | "external";

interface StepAssessment {
  step: RoadmapStep;
  state: StepState;
  reason: string;
}

interface SpaceAnalysis {
  property: PropertyRecord;
  score: number;
  zoneFit: "good" | "conditional" | "weak";
  zoneReason: string;
  steps: StepAssessment[];
  missing: StepAssessment[];
  ready: StepAssessment[];
  external: StepAssessment[];
}

function normalized(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hasActiveAuthorization(property: PropertyRecord, terms: string[]) {
  return property.authorizations.existing.some((authorization) => {
    const haystack = normalized(
      `${authorization.type} ${authorization.authority} ${authorization.notes ?? ""}`,
    );
    return authorization.status === "active" && terms.some((term) => haystack.includes(term));
  });
}

function assessStep(property: PropertyRecord, step: RoadmapStep): StepAssessment {
  const title = normalized(`${step.id} ${step.title} ${step.authority}`);

  if (title.includes("onrc")) {
    return {
      step,
      state: "external",
      reason: "Ține de firmă, nu de spațiu. Verifică dacă punctul de lucru și codul CAEN sunt actualizate la ONRC.",
    };
  }

  if (title.includes("certificat") || title.includes("urbanism") || step.id === "cu") {
    const hasValidCertificate = property.urbanism.certificateStatus === "valid";
    return {
      step,
      state: hasValidCertificate ? "ready" : "missing",
      reason: hasValidCertificate
        ? `Există certificat de urbanism valid${property.urbanism.certificateNumber ? `: ${property.urbanism.certificateNumber}` : ""}.`
        : "Certificatul de urbanism lipsește sau este expirat.",
    };
  }

  if (title.includes("dsp") || title.includes("sanitar")) {
    const ready = hasActiveAuthorization(property, ["dsp", "sanitar"]);
    return {
      step,
      state: ready ? "ready" : "missing",
      reason: ready
        ? "Există aviz/autorizație sanitară activă în datele spațiului."
        : "Nu apare un aviz sanitar DSP activ pentru acest spațiu.",
    };
  }

  if (title.includes("isu") || title.includes("incendiu")) {
    const ready = hasActiveAuthorization(property, ["isu", "incendiu", "psi"]);
    return {
      step,
      state: ready ? "ready" : "missing",
      reason: ready
        ? "Există aviz sau autorizație ISU activă în datele spațiului."
        : "Nu apare un aviz ISU activ pentru spațiu.",
    };
  }

  if (title.includes("dsvsa")) {
    const ready = hasActiveAuthorization(property, ["dsvsa", "veterinar"]);
    return {
      step,
      state: ready ? "ready" : "missing",
      reason: ready
        ? "Există verificare DSVSA în datele spațiului."
        : "Nu apare aviz DSVSA; poate fi necesar în funcție de produse și flux.",
    };
  }

  if (title.includes("functionare") || title.includes("acord")) {
    const ready = hasActiveAuthorization(property, ["functionare", "acord"]);
    return {
      step,
      state: ready ? "ready" : "missing",
      reason: ready
        ? "Există acord/autorizație de funcționare activă."
        : "Nu apare acord sau autorizație de funcționare activă pentru activitatea aleasă.",
    };
  }

  return {
    step,
    state: "missing",
    reason: "Pasul trebuie verificat manual pentru acest spațiu.",
  };
}

function assessZone(property: PropertyRecord, roadmap: CaenRoadmap) {
  const category = normalized(roadmap.category);
  const zone = normalized(`${property.pugZone} ${property.urbanism.allowedDestinations.join(" ")}`);
  const hasCommercialUse =
    zone.includes("comert") ||
    zone.includes("servicii") ||
    zone.includes("mixt") ||
    zone.includes("comercial");

  if (category.includes("horeca") || category.includes("retail")) {
    return hasCommercialUse
      ? {
          fit: "good" as const,
          reason: "Zona permite sau indică utilizări comerciale/servicii, deci activitatea are o bază urbanistică bună.",
        }
      : {
          fit: "weak" as const,
          reason: "Zona nu indică explicit comerț sau servicii; poate fi nevoie de schimbare de destinație.",
        };
  }

  if (category.includes("servicii")) {
    return zone.includes("servicii") || zone.includes("mixt")
      ? {
          fit: "good" as const,
          reason: "Destinația de servicii este compatibilă cu profilul CAEN selectat.",
        }
      : {
          fit: "conditional" as const,
          reason: "Activitatea de servicii poate fi posibilă, dar trebuie confirmată prin certificatul de urbanism.",
        };
  }

  return {
    fit: "conditional" as const,
    reason: "Compatibilitatea depinde de modul de folosire efectivă a spațiului și de documentele punctului de lucru.",
  };
}

function analyzeSpace(property: PropertyRecord, roadmap: CaenRoadmap): SpaceAnalysis {
  const steps = roadmap.steps.map((step) => assessStep(property, step));
  const ready = steps.filter((step) => step.state === "ready");
  const missing = steps.filter((step) => step.state === "missing");
  const external = steps.filter((step) => step.state === "external");
  const relevantSteps = steps.length - external.length || 1;
  const baseScore = Math.round((ready.length / relevantSteps) * 100);
  const zone = assessZone(property, roadmap);
  const zoneMultiplier = zone.fit === "good" ? 1 : zone.fit === "conditional" ? 0.88 : 0.72;
  const score = Math.max(5, Math.min(100, Math.round(baseScore * zoneMultiplier)));

  return {
    property,
    score,
    zoneFit: zone.fit,
    zoneReason: zone.reason,
    steps,
    missing,
    ready,
    external,
  };
}

function scoreLabel(score: number) {
  if (score >= 80) return "Foarte pregătit";
  if (score >= 55) return "Pregătire medie";
  return "Necesită pași importanți";
}

function zoneBadgeVariant(zoneFit: SpaceAnalysis["zoneFit"]) {
  return zoneFit === "good" ? "default" : zoneFit === "conditional" ? "secondary" : "destructive";
}

interface RoadmapCaenPageClientProps {
  initialCf?: string;
}

export function RoadmapCaenPageClient({ initialCf }: RoadmapCaenPageClientProps) {
  const [mode, setMode] = useState<Mode>("audit");
  const [caenQuery, setCaenQuery] = useState("");
  const [caenOptions, setCaenOptions] = useState<CaenOption[]>([]);
  const [roadmap, setRoadmap] = useState<CaenRoadmap | null>(null);
  const [cfNumber, setCfNumber] = useState(initialCf ?? "");
  const [analysis, setAnalysis] = useState<SpaceAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<SpaceAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exactOption = useMemo(
    () => caenOptions.find((option) => option.code === caenQuery.trim()),
    [caenOptions, caenQuery],
  );

  useEffect(() => {
    if (initialCf) {
      setCfNumber(initialCf);
      setMode("audit");
    }
  }, [initialCf]);

  useEffect(() => {
    let ignore = false;

    async function searchCaen() {
      const response = await fetch(`/api/caen/search?q=${encodeURIComponent(caenQuery)}`);
      if (!response.ok || ignore) return;
      const data = (await response.json()) as CaenOption[];
      setCaenOptions(data);
    }

    searchCaen();
    return () => {
      ignore = true;
    };
  }, [caenQuery]);

  async function loadRoadmap(code = caenQuery.trim()) {
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      throw new Error("Introdu un cod CAEN.");
    }

    const response = await fetch(`/api/roadmap/${encodeURIComponent(normalizedCode)}`);
    if (!response.ok) {
      throw new Error("Nu am găsit un roadmap pentru acest cod CAEN în datele demo.");
    }

    const data = (await response.json()) as CaenRoadmap;
    setRoadmap(data);
    setCaenQuery(data.caen);
    return data;
  }

  async function handleAuditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const activeRoadmap = roadmap ?? (await loadRoadmap());
      const ref = cfNumber.trim();
      if (!ref) throw new Error("Introdu un număr de carte funciară.");

      const response = await fetch(`/api/properties/${encodeURIComponent(ref)}`);
      if (!response.ok) throw new Error("Nu am putut încărca spațiul pentru cartea funciară.");

      const property = (await response.json()) as PropertyRecord;
      setAnalysis(analyzeSpace(property, activeRoadmap));
    } catch (err) {
      setAnalysis(null);
      setError(err instanceof Error ? err.message : "A apărut o eroare la analiză.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecommendationsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const activeRoadmap = roadmap ?? (await loadRoadmap());
      const spaces = await Promise.all(
        DEMO_SPACE_REFS.map(async (ref) => {
          const response = await fetch(`/api/properties/${encodeURIComponent(ref)}`);
          if (!response.ok) throw new Error(`Spațiul ${ref} nu a putut fi încărcat.`);
          return (await response.json()) as PropertyRecord;
        }),
      );

      setRecommendations(
        spaces
          .map((property) => analyzeSpace(property, activeRoadmap))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3),
      );
    } catch (err) {
      setRecommendations([]);
      setError(err instanceof Error ? err.message : "A apărut o eroare la recomandări.");
    } finally {
      setLoading(false);
    }
  }

  function selectCaen(option: CaenOption) {
    setCaenQuery(option.code);
    setError(null);
    loadRoadmap(option.code).catch((err) => {
      setRoadmap(null);
      setError(err instanceof Error ? err.message : "Nu am putut încărca roadmap-ul.");
    });
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
            Roadmap CAEN
          </p>
          <h1 className="font-heading text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            Află cât de potrivit este un spațiu pentru activitatea firmei tale
          </h1>
          <p className="mt-4 text-muted-foreground">
            Introdu codul CAEN, apoi verifică un spațiu prin carte funciară sau primește
            recomandări din spațiile demo de pe hartă.
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Cod CAEN</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="caen">Activitatea economică</Label>
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="caen"
                  className="pl-8"
                  inputMode="numeric"
                  placeholder="ex. 5630, restaurant, salon"
                  value={caenQuery}
                  onChange={(event) => {
                    setCaenQuery(event.target.value);
                    setRoadmap(null);
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {caenOptions.slice(0, 5).map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => selectCaen(option)}
                  className="cursor-pointer rounded-lg border border-border bg-secondary/50 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <span className="font-mono text-primary">{option.code}</span>
                  <span className="ml-2 text-foreground">{option.label}</span>
                </button>
              ))}
            </div>

            {roadmap || exactOption ? (
              <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
                <p className="font-medium text-foreground">
                  CAEN {roadmap?.caen ?? exactOption?.code} —{" "}
                  {roadmap?.label ?? exactOption?.label}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {roadmap
                    ? `${roadmap.steps.length} pași de autorizare încărcați.`
                    : "Selectează codul pentru a încărca pașii."}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("audit")}
            className={`cursor-pointer rounded-xl border p-4 text-left transition-colors ${
              mode === "audit"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-secondary/60"
            }`}
          >
            <ClipboardCheck className="mb-3 size-5 text-primary" aria-hidden />
            <span className="block font-medium text-foreground">Analizează un CF</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Scrii cartea funciară și vezi ce autorizații lipsesc.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("recommend")}
            className={`cursor-pointer rounded-xl border p-4 text-left transition-colors ${
              mode === "recommend"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-secondary/60"
            }`}
          >
            <MapPinned className="mb-3 size-5 text-primary" aria-hidden />
            <span className="block font-medium text-foreground">Recomandă spații</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Folosești doar CAEN-ul și primești variante potrivite.
            </span>
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>
              {mode === "audit" ? "Verifică spațiul ales" : "Găsește spații potrivite"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "audit" ? (
              <form className="space-y-4" onSubmit={handleAuditSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="cf">Număr carte funciară</Label>
                  <Input
                    id="cf"
                    placeholder="ex. 424500-CF-001234"
                    value={cfNumber}
                    onChange={(event) => setCfNumber(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pentru demo poți încerca 424500-CF-001234, 424500-CF-009012 sau orice
                    referință cadastrală.
                  </p>
                </div>
                <Button type="submit" className="h-10 w-full cursor-pointer">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Analizează pregătirea spațiului
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRecommendationsSubmit}>
                <p className="text-sm text-muted-foreground">
                  Comparăm spațiile demo după compatibilitatea urbanistică și autorizațiile
                  existente pentru codul CAEN selectat.
                </p>
                <Button type="submit" className="h-10 w-full cursor-pointer">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Recomandă spații de pe hartă
                </Button>
              </form>
            )}

            {error ? (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {analysis ? <AnalysisCard analysis={analysis} roadmap={roadmap} /> : null}

        {recommendations.length > 0 ? (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Spații recomandate
              </h2>
              <p className="text-sm text-muted-foreground">
                Sortate după scorul de pregătire pentru CAEN {roadmap?.caen}.
              </p>
            </div>
            {recommendations.map((item) => (
              <RecommendationCard key={item.property.cadastralRef} analysis={item} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function AnalysisCard({
  analysis,
  roadmap,
}: {
  analysis: SpaceAnalysis;
  roadmap: CaenRoadmap | null;
}) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Rezultat analiză</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {analysis.property.address} · {analysis.property.cadastralRef}
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-3xl font-semibold text-primary">{analysis.score}%</p>
            <p className="text-xs text-muted-foreground">{scoreLabel(analysis.score)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant={zoneBadgeVariant(analysis.zoneFit)}>
            {analysis.zoneFit === "good"
              ? "Zonă potrivită"
              : analysis.zoneFit === "conditional"
                ? "Necesită confirmare"
                : "Compatibilitate slabă"}
          </Badge>
          {roadmap ? <Badge variant="outline">CAEN {roadmap.caen}</Badge> : null}
          <Badge variant="outline">{analysis.property.areaSqm} m²</Badge>
        </div>

        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          {analysis.zoneReason}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">Ce există deja</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {analysis.ready.length ? (
                analysis.ready.map((item) => (
                  <li key={item.step.id} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{item.step.title}</span>
                  </li>
                ))
              ) : (
                <li>Nu am găsit autorizații active relevante în datele demo.</li>
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">Ce lipsește</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {analysis.missing.length ? (
                analysis.missing.map((item) => (
                  <li key={item.step.id} className="flex gap-2">
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <span>{item.step.title}</span>
                  </li>
                ))
              ) : (
                <li>Nu lipsesc pași majori în datele analizate.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Detaliu pași</p>
          {analysis.steps.map((item) => (
            <div key={item.step.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{item.step.title}</p>
                <Badge
                  variant={
                    item.state === "ready"
                      ? "default"
                      : item.state === "external"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {item.state === "ready"
                    ? "pregătit"
                    : item.state === "external"
                      ? "în afara spațiului"
                      : "lipsește"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
              {item.state === "missing" ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Documente utile: {item.step.docs.join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ analysis }: { analysis: SpaceAnalysis }) {
  const firstMissing = analysis.missing[0]?.step.title;

  return (
    <Card className="border-border">
      <CardContent className="space-y-4 pt-1">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" aria-hidden />
              <h3 className="font-medium text-foreground">{analysis.property.address}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {analysis.property.cadastralRef} · {analysis.property.pugZone}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-heading text-2xl font-semibold text-primary">{analysis.score}%</p>
            <p className="text-xs text-muted-foreground">{scoreLabel(analysis.score)}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{analysis.zoneReason}</p>

        {firstMissing ? (
          <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            Primul blocaj de rezolvat: <span className="font-medium">{firstMissing}</span>.
          </p>
        ) : null}

        <Link
          href={`/harta?cf=${encodeURIComponent(analysis.property.cadastralRef)}`}
          className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          Vezi contextul pe hartă
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
