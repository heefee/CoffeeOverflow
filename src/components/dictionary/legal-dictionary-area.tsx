"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SelectionInfo {
  term: string;
  context: string;
  rect: DOMRect;
}

function extractContextSentence(fullText: string, term: string) {
  const index = fullText.indexOf(term);
  if (index === -1) {
    return fullText.slice(0, 240).trim().replace(/\s+/g, " ");
  }

  const before = fullText.slice(0, index);
  const after = fullText.slice(index + term.length);

  const sentenceStart = Math.max(
    before.lastIndexOf(". ") + 2,
    before.lastIndexOf("! ") + 2,
    before.lastIndexOf("? ") + 2,
    before.lastIndexOf("\n") + 1,
    0,
  );

  const afterMatch = after.search(/[.!?\n]/);
  const sentenceEnd =
    index + term.length + (afterMatch === -1 ? after.length : afterMatch + 1);

  return fullText.slice(sentenceStart, sentenceEnd).trim().replace(/\s+/g, " ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface LegalDictionaryAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function LegalDictionaryArea({ children, className }: LegalDictionaryAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [showDefinition, setShowDefinition] = useState(false);
  const [definition, setDefinition] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setShowDefinition(false);
    setDefinition(null);
    setError(null);
    setLoading(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    requestAnimationFrame(() => {
      const sel = window.getSelection();
      const container = containerRef.current;

      if (!sel || sel.isCollapsed || !container) {
        return;
      }

      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        return;
      }

      const term = sel.toString().trim();
      if (term.length < 2 || term.length > 120) {
        clearSelection();
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        clearSelection();
        return;
      }

      const context = extractContextSentence(container.innerText, term);
      setSelection({ term, context, rect });
      setShowDefinition(false);
      setDefinition(null);
      setError(null);
      setLoading(false);
    });
  }, [clearSelection]);

  const lookupTerm = useCallback(async () => {
    if (!selection) return;

    setShowDefinition(true);
    setLoading(true);
    setError(null);
    setDefinition(null);

    try {
      const response = await fetch("/api/dictionary/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: selection.term,
          context: selection.context,
        }),
      });

      const data = (await response.json()) as { definition?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Nu am putut obține definiția.");
      }

      setDefinition(data.definition ?? null);
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "Nu am putut obține definiția.",
      );
    } finally {
      setLoading(false);
    }
  }, [selection]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-legal-dictionary-popup]")) return;
      clearSelection();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [clearSelection]);

  useEffect(() => {
    if (!selection) return;

    function handleScroll() {
      clearSelection();
    }

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [selection, clearSelection]);

  const buttonPosition = selection
    ? {
        top: clamp(selection.rect.top - 34, 8, window.innerHeight - 40),
        left: clamp(selection.rect.right + 6, 8, window.innerWidth - 40),
      }
    : null;

  const popupPosition = selection
    ? {
        top: clamp(selection.rect.bottom + 8, 8, window.innerHeight - 220),
        left: clamp(selection.rect.left, 8, window.innerWidth - 424),
      }
    : null;

  return (
    <>
      <div ref={containerRef} className={cn(className)} onMouseUp={handleMouseUp}>
        {children}
      </div>

      {mounted && selection && buttonPosition && popupPosition
        ? createPortal(
            <>
              {!showDefinition ? (
                <Button
                  data-legal-dictionary-popup
                  type="button"
                  size="icon-xs"
                  variant="default"
                  className="fixed z-50 shadow-md"
                  style={{ top: buttonPosition.top, left: buttonPosition.left }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void lookupTerm();
                  }}
                  title="Dicționar juridic"
                  aria-label={`Explică termenul: ${selection.term}`}
                >
                  <BookOpen aria-hidden />
                </Button>
              ) : (
                <div
                  data-legal-dictionary-popup
                  className="fixed z-50 w-[min(26rem,calc(100vw-1rem))] rounded-lg border border-border bg-card p-4 shadow-lg"
                  style={{ top: popupPosition.top, left: popupPosition.left }}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {selection.term}
                    </p>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={clearSelection}
                      aria-label="Închide dicționarul"
                    >
                      <X aria-hidden />
                    </Button>
                  </div>

                  {loading ? (
                    <div className="flex min-h-[4.5rem] items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Se încarcă definiția...
                    </div>
                  ) : null}

                  {error ? (
                    <p className="min-h-[4.5rem] text-sm text-destructive">{error}</p>
                  ) : null}

                  {definition ? (
                    <p className="min-h-[4.5rem] text-sm leading-relaxed text-muted-foreground">
                      {definition}
                    </p>
                  ) : null}

                  <p className="mt-2 text-[10px] text-muted-foreground/70">
                    Informații orientative, nu consultanță juridică.
                  </p>
                </div>
              )}
            </>,
            document.body,
          )
        : null}
    </>
  );
}
