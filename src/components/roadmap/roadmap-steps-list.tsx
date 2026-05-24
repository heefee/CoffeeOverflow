"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CaenRoadmap } from "@/types";
import { Clock, ExternalLink } from "lucide-react";
import { RoadmapStepDocsChecklist } from "./roadmap-step-docs-checklist";

interface RoadmapStepsListProps {
  roadmap: CaenRoadmap;
  storageScope?: string;
}

export function RoadmapStepsList({ roadmap, storageScope }: RoadmapStepsListProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Pași și acte necesare
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          CAEN {roadmap.caen} — {roadmap.label}. Bifează actele pe măsură ce le pregătești.
        </p>
      </div>

      <ol className="space-y-4">
        {roadmap.steps.map((step, index) => (
          <li key={step.id}>
            <Card className="border-border shadow-sm">
              <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-medium text-foreground">{step.title}</h3>
                      <p className="text-sm text-primary">{step.authority}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <Clock className="size-3" aria-hidden />
                    ~{step.estimatedDays} zile
                  </Badge>
                </div>

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
                  storageScope={storageScope}
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
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
