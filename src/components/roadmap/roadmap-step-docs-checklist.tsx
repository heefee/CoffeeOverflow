"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface RoadmapStepDocsChecklistProps {
  caen: string;
  stepId: string;
  docs: string[];
  /** Carte funciară sau alt identificator de context pentru persistență. */
  storageScope?: string;
  compact?: boolean;
}

function docKey(doc: string, index: number) {
  return `${index}:${doc}`;
}

export function RoadmapStepDocsChecklist({
  caen,
  stepId,
  docs,
  storageScope = "general",
  compact,
}: RoadmapStepDocsChecklistProps) {
  const storageKey = `roadmap-docs:${caen}:${storageScope}:${stepId}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const defaults = Object.fromEntries(docs.map((doc, index) => [docKey(doc, index), false]));

    try {
      const stored = window.localStorage.getItem(storageKey);
      setChecked(stored ? { ...defaults, ...JSON.parse(stored) } : defaults);
    } catch {
      setChecked(defaults);
    }
  }, [storageKey, docs]);

  function toggleDoc(key: string) {
    setChecked((current) => {
      const next = { ...current, [key]: !current[key] };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Persistența locală este opțională.
      }
      return next;
    });
  }

  if (!docs.length) return null;

  const doneCount = docs.filter((doc, index) => checked[docKey(doc, index)]).length;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Acte necesare
          </p>
          <Badge variant="outline" className="text-[10px]">
            {doneCount}/{docs.length} bifate
          </Badge>
        </div>
      ) : null}
      <ul className="space-y-1.5">
        {docs.map((doc, index) => {
          const key = docKey(doc, index);
          const isDone = Boolean(checked[key]);
          return (
            <li key={key}>
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-background/80 text-sm transition-colors hover:bg-secondary/50 ${
                  compact ? "p-2" : "p-2.5"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleDoc(key)}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
                />
                <span
                  className={
                    isDone
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }
                >
                  {doc}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
