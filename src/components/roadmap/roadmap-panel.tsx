"use client";

import { LegalDictionaryArea } from "@/components/dictionary/legal-dictionary-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/app-store";
import type { Authorization, PropertyRecord, RoadmapStep } from "@/types";
import { ArrowLeft, CheckCircle2, CircleDashed, Clock, ExternalLink } from "lucide-react";
import { RoadmapStepDocsChecklist } from "./roadmap-step-docs-checklist";

interface RoadmapPanelProps {
  onBack: () => void;
}

type StepStatus = "completed" | "needed" | "external";

interface StepAssessment {
  status: StepStatus;
  reason: string;
  authorization?: Authorization;
}

function normalized(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function findActiveAuthorization(
  property: PropertyRecord,
  terms: string[],
): Authorization | undefined {
  return property.authorizations.existing.find((authorization) => {
    const haystack = normalized(
      `${authorization.type} ${authorization.authority} ${authorization.notes ?? ""}`,
    );
    return authorization.status === "active" && terms.some((term) => haystack.includes(term));
  });
}

function assessRoadmapStep(
  property: PropertyRecord | null,
  step: RoadmapStep,
): StepAssessment {
  if (!property) {
    return { status: "needed", reason: "Selectează un imobil pentru verificare automată." };
  }

  const title = normalized(`${step.id} ${step.title} ${step.authority}`);
  const checks: Array<{ terms: string[]; completed: string; missing: string }> = [
    {
      terms: ["isu", "incendiu", "psi"],
      completed: "Există aviz/autorizație ISU activă pentru acest spațiu.",
      missing: "Nu apare un aviz/autorizație ISU activă în datele spațiului.",
    },
    {
      terms: ["dsp", "sanitar", "sanitara"],
      completed: "Există aviz/autorizație sanitară activă.",
      missing: "Nu apare un aviz sanitar DSP activ.",
    },
    {
      terms: ["mediu", "apm"],
      completed: "Există act de mediu activ în datele spațiului.",
      missing: "Nu apare un acord/act APM activ.",
    },
    {
      terms: ["clasificare", "turism", "stele"],
      completed: "Există certificat de clasificare turistică activ.",
      missing: "Nu apare certificat de clasificare turistică activ.",
    },
    {
      terms: ["functionare", "funcționare", "acord"],
      completed: "Există acord/autorizație de funcționare activă.",
      missing: "Nu apare autorizație de funcționare activă.",
    },
    {
      terms: ["monumente", "crmci", "cultura", "culturii"],
      completed: "Există aviz de monumente/cultură activ.",
      missing: "Nu apare aviz CRMCI/monumente activ.",
    },
    {
      terms: ["geotehnic", "stabilitate"],
      completed: "Există studiu geotehnic/stabilitate în datele spațiului.",
      missing: "Nu apare studiu geotehnic/stabilitate în datele spațiului.",
    },
    {
      terms: ["onrc", "caen"],
      completed: "Există dovadă ONRC/CAEN în datele spațiului.",
      missing: "Ține de firmă/punct de lucru: verifică ONRC și codul CAEN.",
    },
  ];

  if (title.includes("urbanism") || step.id === "cu") {
    const certificate = findActiveAuthorization(property, ["urbanism", "certificat"]);
    if (property.urbanism.certificateStatus === "valid" || certificate) {
      return {
        status: "completed",
        authorization: certificate,
        reason: `Există certificat de urbanism valid${
          property.urbanism.certificateNumber ? `: ${property.urbanism.certificateNumber}` : ""
        }.`,
      };
    }
    return {
      status: "needed",
      reason: "Certificatul de urbanism lipsește sau este expirat.",
    };
  }

  const check = checks.find((candidate) =>
    candidate.terms.some((term) => title.includes(term)),
  );

  if (!check) {
    return { status: "needed", reason: "Pas de verificat manual pentru acest spațiu." };
  }

  const authorization = findActiveAuthorization(property, check.terms);
  if (authorization) {
    return { status: "completed", authorization, reason: check.completed };
  }

  return {
    status: check.terms.includes("onrc") ? "external" : "needed",
    reason: check.missing,
  };
}

export function RoadmapPanel({ onBack }: RoadmapPanelProps) {
  const { roadmap, selectedProperty, selectedCaen } = useAppStore();

  if (!roadmap) return null;

  const stepsWithStatus = roadmap.steps.map((step) => ({
    step,
    assessment: assessRoadmapStep(selectedProperty, step),
  }));
  const remainingDays = stepsWithStatus.reduce(
    (sum, { step, assessment }) =>
      assessment.status === "completed" ? sum : sum + step.estimatedDays,
    0,
  );
  const completedCount = stepsWithStatus.filter(
    ({ assessment }) => assessment.status === "completed",
  ).length;

  return (
    <LegalDictionaryArea className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 cursor-pointer"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          Înapoi la detalii
        </Button>
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Roadmap autorizări
        </h2>
        <p className="text-sm text-muted-foreground">
          CAEN {roadmap.caen} — {roadmap.label}
        </p>
        {selectedProperty ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Imobil: {selectedProperty.cadastralRef}
            {selectedCaen ? ` · activitate ${selectedCaen}` : ""}
          </p>
        ) : null}
        <div className="mt-2 flex gap-2">
          <Badge>{roadmap.category}</Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" />
            ~{remainingDays} zile rămase
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="size-3" />
            {completedCount}/{roadmap.steps.length} completate
          </Badge>
        </div>
      </div>

      <ol className="flex-1 space-y-0 overflow-y-auto p-4">
        {stepsWithStatus.map(({ step, assessment }, index) => (
          <li key={step.id} className="relative flex gap-3 pb-6">
            {index < roadmap.steps.length - 1 ? (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5 bg-border"
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                assessment.status === "completed"
                  ? "bg-success text-white"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {assessment.status === "completed" ? (
                <CheckCircle2 className="size-4" />
              ) : (
                index + 1
              )}
            </span>
            <Card
              className={`flex-1 border-border shadow-sm ${
                assessment.status === "completed" ? "bg-success/5" : ""
              }`}
            >
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-foreground">{step.title}</h3>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      variant={
                        assessment.status === "completed"
                          ? "default"
                          : assessment.status === "external"
                            ? "secondary"
                            : "outline"
                      }
                      className="gap-1 text-[10px]"
                    >
                      {assessment.status === "completed" ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <CircleDashed className="size-3" />
                      )}
                      {assessment.status === "completed"
                        ? "Completat"
                        : assessment.status === "external"
                          ? "Extern"
                          : "Necesar"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {assessment.status === "completed"
                        ? "0 zile"
                        : `~${step.estimatedDays} zile`}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-primary">{step.authority}</p>
                <p
                  className={`text-xs ${
                    assessment.status === "completed"
                      ? "text-success"
                      : "text-muted-foreground"
                  }`}
                >
                  {assessment.reason}
                  {assessment.authorization?.number
                    ? ` Act: ${assessment.authorization.number}.`
                    : ""}
                </p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.dependsOn?.length ? (
                  <p className="text-xs text-muted-foreground">
                    Depinde de: {step.dependsOn.join(", ")}
                  </p>
                ) : null}
                <RoadmapStepDocsChecklist
                  caen={roadmap.caen}
                  stepId={step.id}
                  docs={step.docs}
                  storageScope={selectedProperty?.cadastralRef ?? "general"}
                  compact
                />
                {step.legalRef ? (
                  <p className="text-xs text-muted-foreground">{step.legalRef}</p>
                ) : null}
                {step.edirectUrl ? (
                  <a
                    href={step.edirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex cursor-pointer items-center gap-1 text-xs text-accent hover:underline"
                  >
                    Procedură eDirect
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </LegalDictionaryArea>
  );
}
