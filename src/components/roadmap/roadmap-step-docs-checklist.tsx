"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  const defaults = useMemo(
    () => Object.fromEntries(docs.map((doc, index) => [docKey(doc, index), false])),
    [docs],
  );
  const [checked, setChecked] = useState<Record<string, boolean>>(defaults);
  const [canUseChecklist, setCanUseChecklist] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadAuthStatus() {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok || ignore) return;
      const data = (await response.json()) as { authenticated?: boolean };
      setCanUseChecklist(Boolean(data.authenticated));
    }

    loadAuthStatus();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!canUseChecklist) {
        setChecked(defaults);
        return;
      }

      try {
        const stored = window.localStorage.getItem(storageKey);
        setChecked(stored ? { ...defaults, ...JSON.parse(stored) } : defaults);
      } catch {
        setChecked(defaults);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [canUseChecklist, defaults, storageKey]);

  function toggleDoc(key: string) {
    if (!canUseChecklist) return;
    try {
      setChecked((current) => {
        const next = { ...current, [key]: !current[key] };
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    } catch {
      setChecked((current) => ({ ...current, [key]: !current[key] }));
    }
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
            {canUseChecklist ? `${doneCount}/${docs.length} bifate` : "ROeID necesar"}
          </Badge>
        </div>
      ) : null}
      {!canUseChecklist ? (
        <div className="rounded-lg bg-secondary/70 p-3 text-xs text-muted-foreground">
          Checklist-ul se salvează doar pentru utilizatori autentificați.{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Conectează-te cu ROeID
          </Link>{" "}
          pentru a bifa și păstra progresul.
        </div>
      ) : null}
      <ul className="space-y-1.5">
        {docs.map((doc, index) => {
          const key = docKey(doc, index);
          const isDone = Boolean(checked[key]);
          return (
            <li key={key}>
              <label
                className={`flex items-start gap-2.5 rounded-md border border-border bg-background/80 text-sm transition-colors ${
                  canUseChecklist
                    ? "cursor-pointer hover:bg-secondary/50"
                    : "cursor-not-allowed opacity-70"
                } ${
                  compact ? "p-2" : "p-2.5"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  disabled={!canUseChecklist}
                  onChange={() => toggleDoc(key)}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
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
