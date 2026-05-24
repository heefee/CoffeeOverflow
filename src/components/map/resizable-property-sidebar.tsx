"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { MAP_SIDEBAR_RESIZE_END, MAP_SIDEBAR_RESIZE_START } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "eavizat-map-sidebar-width";
const MIN_WIDTH = 280;
const DEFAULT_WIDTH = 420;
const MAX_WIDTH_CAP = 720;

function getMaxWidth(viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280) {
  return Math.min(Math.round(viewportWidth * 0.55), MAX_WIDTH_CAP);
}

function clampWidth(width: number, viewportWidth?: number) {
  return Math.min(Math.max(width, MIN_WIDTH), getMaxWidth(viewportWidth));
}

function readStoredWidth() {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number.parseInt(stored, 10);
      if (!Number.isNaN(parsed)) return clampWidth(parsed);
    }
  } catch {
    // Local persistence is optional.
  }
  return DEFAULT_WIDTH;
}

function notifyMapLayoutEnd() {
  window.dispatchEvent(new Event(MAP_SIDEBAR_RESIZE_END));
}

interface ResizablePropertySidebarProps {
  children: ReactNode;
}

export function ResizablePropertySidebar({ children }: ResizablePropertySidebarProps) {
  const [width, setWidth] = useState(() => readStoredWidth());
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    if (!isResizing) return;

    window.dispatchEvent(new Event(MAP_SIDEBAR_RESIZE_START));

    function onPointerMove(event: PointerEvent) {
      const delta = startXRef.current - event.clientX;
      setWidth(clampWidth(startWidthRef.current + delta));
    }

    function onPointerUp() {
      setIsResizing(false);
      setWidth((current) => {
        try {
          window.localStorage.setItem(STORAGE_KEY, String(current));
        } catch {
          // Local persistence is optional.
        }
        return current;
      });
      requestAnimationFrame(notifyMapLayoutEnd);
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isResizing]);

  useEffect(() => {
    function onResize() {
      setWidth((current) => clampWidth(current));
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      startXRef.current = event.clientX;
      startWidthRef.current = width;
      setIsResizing(true);
    },
    [width],
  );

  const onDoubleClick = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(DEFAULT_WIDTH));
    } catch {
      // Local persistence is optional.
    }
    requestAnimationFrame(notifyMapLayoutEnd);
  }, []);

  return (
    <>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={width}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={getMaxWidth()}
        aria-label="Redimensionează panoul de detalii"
        title="Trage pentru redimensionare · dublu-click pentru reset"
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        className={cn(
          "group relative z-10 flex w-2 shrink-0 cursor-col-resize items-center justify-center touch-none",
          "hover:bg-primary/10 active:bg-primary/15",
          isResizing && "bg-primary/15",
        )}
      >
        <div className="absolute inset-y-0 -left-1 w-4" aria-hidden />
        <GripVertical
          className={cn(
            "size-3 text-muted-foreground/50 transition-colors",
            "group-hover:text-primary group-active:text-primary",
            isResizing && "text-primary",
          )}
          aria-hidden
        />
      </div>

      <aside
        className={cn(
          "map-property-sidebar @container/sidebar flex h-full shrink-0 flex-col border-l border-border bg-card shadow-lg",
          isResizing && "pointer-events-none select-none",
        )}
        style={{ width }}
      >
        <div className="map-property-sidebar-content shrink-0 border-b border-border bg-secondary/60 px-4 py-2.5">
          <p className="font-semibold uppercase tracking-wide text-primary">Detalii imobil</p>
        </div>
        <div className="map-property-sidebar-content min-h-0 flex-1">{children}</div>
      </aside>
    </>
  );
}
