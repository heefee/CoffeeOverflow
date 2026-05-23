"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";
import type { CaenOption } from "@/types";
import { Search } from "lucide-react";

interface CaenSelectorProps {
  compact?: boolean;
}

export function CaenSelector({ compact }: CaenSelectorProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<CaenOption[]>([]);
  const { setSelectedCaen, setRoadmap, setShowRoadmap } = useAppStore();

  const search = async (q: string) => {
    setQuery(q);
    const res = await fetch(`/api/caen/search?q=${encodeURIComponent(q)}`);
    const data = (await res.json()) as CaenOption[];
    setOptions(data);
  };

  useEffect(() => {
    let ignore = false;

    async function loadInitialOptions() {
      const res = await fetch("/api/caen/search?q=");
      const data = (await res.json()) as CaenOption[];
      if (!ignore) setOptions(data);
    }

    loadInitialOptions();
    return () => {
      ignore = true;
    };
  }, []);

  const selectCaen = async (code: string) => {
    setSelectedCaen(code);
    const res = await fetch(`/api/roadmap/${code}`);
    if (res.ok) {
      const roadmap = await res.json();
      setRoadmap(roadmap);
      setShowRoadmap(true);
    }
  };

  return (
    <div className={compact ? "space-y-2 border-t border-border pt-4" : "space-y-4"}>
      {!compact ? (
        <h3 className="font-heading text-base font-semibold text-foreground">
          Selectați activitatea (CAEN)
        </h3>
      ) : (
        <Label className="text-xs text-muted-foreground">Sau căutați cod CAEN</Label>
      )}
      <div className="relative">
        <Search
          className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="pl-8"
          placeholder="ex. cafenea, 5630, restaurant"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => search(query)}
        />
      </div>
      <ul className="max-h-40 space-y-1 overflow-y-auto">
        {options.map((o) => (
          <li key={o.code}>
            <button
              type="button"
              onClick={() => selectCaen(o.code)}
              className="w-full cursor-pointer rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-secondary"
            >
              <span className="font-mono text-primary">{o.code}</span>
              <span className="ml-2 text-foreground">{o.label}</span>
              <span className="ml-1 text-xs text-muted-foreground">({o.category})</span>
            </button>
          </li>
        ))}
      </ul>
      {!compact && (
        <div className="flex flex-wrap gap-2">
          {["5630", "5610", "4711"].map((code) => (
            <Button
              key={code}
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => selectCaen(code)}
            >
              {code}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
