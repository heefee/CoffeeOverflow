"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/app-store";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink } from "lucide-react";

interface RoadmapPanelProps {
  onBack: () => void;
}

export function RoadmapPanel({ onBack }: RoadmapPanelProps) {
  const { roadmap, selectedProperty, selectedCaen } = useAppStore();

  if (!roadmap) return null;

  const totalDays = roadmap.steps.reduce((s, step) => s + step.estimatedDays, 0);

  return (
    <div className="flex h-full flex-col">
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
            ~{totalDays} zile (estimare)
          </Badge>
        </div>
      </div>

      <ol className="flex-1 space-y-0 overflow-y-auto p-4">
        {roadmap.steps.map((step, index) => (
          <li key={step.id} className="relative flex gap-3 pb-6">
            {index < roadmap.steps.length - 1 ? (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5 bg-border"
                aria-hidden
              />
            ) : null}
            <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <Card className="flex-1 border-border shadow-sm">
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-foreground">{step.title}</h3>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ~{step.estimatedDays} zile
                  </span>
                </div>
                <p className="text-sm text-primary">{step.authority}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.dependsOn?.length ? (
                  <p className="text-xs text-muted-foreground">
                    Depinde de: {step.dependsOn.join(", ")}
                  </p>
                ) : null}
                <ul className="text-xs text-muted-foreground">
                  {step.docs.map((d) => (
                    <li key={d} className="flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-success" />
                      {d}
                    </li>
                  ))}
                </ul>
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
    </div>
  );
}
